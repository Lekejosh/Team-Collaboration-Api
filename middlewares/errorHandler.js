exports.catchErrors = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => {
      if (typeof err === "string") {
        res.status(400).json({ message: err });
      } else {
        next(err);
      }
    });
  };
};

//Mongoose Error
exports.mongooseErrors = (err, req, res, next) => {
  if (!err.errors) return next(err);
  const errorKeys = Object.keys(err.errors);
  let message = "";
  errorKeys.forEach((key) => (message += err.errors[key].message + ", "));

  message = message.substr(0, message.length - 2);

  res.status(400).json({ message });
};

//Development errors
exports.developmentErrors = (err, req, res, next) => {
  err.stack = err.stack || "";
  const errorDetails = {
    message: err.message,
    stack: err.status,
    stack: err.stack,
  };
  res.status(err.status || 500).json(errorDetails);
};

//Production errors
exports.productionErrors = (err, req, res, next) => {
  res.status(err.status || 500).json({ errors: "Internal Server Error" });
};

//404 error
exports.notFound = (req, res, next) => {
  res.status(404).json({ message: "Route Not Found😭😭😭" });
};
