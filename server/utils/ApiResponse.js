class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) this.data = data;
  }

  static success(res, message = "Success", data = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }

  static created(res, message = "Created", data = null) {
    return ApiResponse.success(res, message, data, 201);
  }
}

module.exports = ApiResponse;
