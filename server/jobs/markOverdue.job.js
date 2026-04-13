const Invoice = require("../models/Invoice");
const logger  = require("../utils/logger");

/**
 * Run daily — marks all sent/viewed invoices past due date as overdue.
 */
const markOverdueInvoices = async () => {
  try {
    const result = await Invoice.updateMany(
      {
        status:    { $in: ["sent", "viewed"] },
        dueDate:   { $lt: new Date() },
        isDeleted: { $ne: true },
      },
      { $set: { status: "overdue" } }
    );
    if (result.modifiedCount > 0) {
      logger.info(`Marked ${result.modifiedCount} invoices as overdue`);
    }
  } catch (err) {
    logger.error(`markOverdueInvoices error: ${err.message}`);
  }
};

module.exports = { markOverdueInvoices };
