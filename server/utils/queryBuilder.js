/**
 * QueryBuilder — reusable utility for building paginated, filtered,
 * sorted, and searched Mongoose queries.
 *
 * Usage:
 *   const result = await new QueryBuilder(Project.find({ owner }), req.query)
 *     .filter()
 *     .search(["title", "description"])
 *     .sort()
 *     .paginate()
 *     .lean()
 *     .exec();
 */
class QueryBuilder {
  constructor(query, reqQuery = {}) {
    this._query    = query;
    this._reqQuery = { ...reqQuery };
    this._model    = query.model;
    this._countQuery = null;
  }

  /**
   * Apply simple equality filters from query string.
   * Excludes reserved keys: page, limit, sort, search, fields.
   */
  filter() {
    const RESERVED = ["page", "limit", "sort", "search", "fields"];
    const filters  = { ...this._reqQuery };
    RESERVED.forEach((k) => delete filters[k]);

    // Support MongoDB operators: gt, gte, lt, lte, ne
    let filterStr = JSON.stringify(filters);
    filterStr = filterStr.replace(/\b(gt|gte|lt|lte|ne|in|nin)\b/g, (m) => `$${m}`);
    this._query = this._query.find(JSON.parse(filterStr));
    return this;
  }

  /**
   * Full-text search across specified fields using regex.
   * Falls back to $text if a text index exists.
   * @param {string[]} fields - Fields to search across
   */
  search(fields = []) {
    const term = this._reqQuery.search?.trim();
    if (!term || !fields.length) return this;

    const regex = new RegExp(term, "i");
    this._query = this._query.find({
      $or: fields.map((f) => ({ [f]: regex })),
    });
    return this;
  }

  /**
   * Sort by query param. Prefix with "-" for descending.
   * Default: -createdAt
   */
  sort(defaultSort = "-createdAt") {
    const sortBy = this._reqQuery.sort || defaultSort;
    this._query  = this._query.sort(sortBy);
    return this;
  }

  /**
   * Field projection — comma-separated list of fields.
   */
  fields() {
    if (this._reqQuery.fields) {
      const projection = this._reqQuery.fields.split(",").join(" ");
      this._query = this._query.select(projection);
    }
    return this;
  }

  /**
   * Cursor-based pagination using page + limit.
   * Attaches pagination metadata to the result.
   */
  paginate(defaultLimit = 10, maxLimit = 100) {
    const page  = Math.max(1, parseInt(this._reqQuery.page,  10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(this._reqQuery.limit, 10) || defaultLimit));
    const skip  = (page - 1) * limit;

    this._page  = page;
    this._limit = limit;
    this._query = this._query.skip(skip).limit(limit);
    return this;
  }

  /**
   * Use lean() for read-only queries — returns plain JS objects,
   * ~2x faster than full Mongoose documents.
   */
  lean() {
    this._query = this._query.lean({ virtuals: true });
    return this;
  }

  /**
   * Populate related documents.
   * @param {string|Object} path
   * @param {string} [select]
   */
  populate(path, select) {
    this._query = this._query.populate(path, select);
    return this;
  }

  /**
   * Execute the query and return data + pagination metadata.
   * Runs count query in parallel for performance.
   */
  async exec() {
    // Clone the query conditions for counting (before skip/limit)
    const countQuery = this._model
      ? this._model.countDocuments(this._query.getFilter())
      : null;

    const [data, total] = await Promise.all([
      this._query.exec(),
      countQuery ? countQuery.exec() : Promise.resolve(null),
    ]);

    const result = { data };

    if (total !== null && this._page !== undefined) {
      result.pagination = {
        total,
        page:    this._page,
        limit:   this._limit,
        pages:   Math.ceil(total / this._limit),
        hasNext: this._page < Math.ceil(total / this._limit),
        hasPrev: this._page > 1,
      };
    }

    return result;
  }
}

module.exports = QueryBuilder;
