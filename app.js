/** BizTime express application. */
const express = require("express");
const app = express();
const ExpressError = require("./expressError");

app.use(express.json());

/** Routes for companies url */
const companiesRoutes = require("./routes/companies");
app.use("/companies", companiesRoutes);

/** Routes for invoices url */
const invoicesRoutes = require("./routes/invoices");
app.use("/invoices", invoicesRoutes);



/** 404 handler */
app.use(function(req, res, next) {
    const err = new ExpressError("Not Found", 404);
    return next(err);
});

/** general error handler */
app.use(function(err, req, res, next) {
    // the default status is 500 Internal Server Error
    let status = err.status || 500;
    let message = err.message;
  
    // set the status and alert the user
    return res.status(status).json({
        error: {message, status}
    });
});

// Export app to start server from server.js
module.exports = app;