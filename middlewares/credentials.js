const allowedOrigin = require("../config/allowedOrigin");

const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigin.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", true);
  }
  next();
};

module.exports = credentials;
