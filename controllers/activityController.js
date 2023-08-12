const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Activity = require("../models/activityModel");
const ErrorHandler = require("../utils/errorHandler");

exports.getAllActivities = catchAsyncErrors(async (req, res, next) => {
  const { chatId } = req.query;

  if (!chatId) {
    return next(new ErrorHandler("Chat Id not Provided", 400));
  }

  const activity = await Activity.find({ chatId: chatId }).sort("-createdAt");

  if (activity.length === 0) {
    res
      .status(200)
      .json({ success: true, message: "No Activity available yet" });
  }

  res.status(200).json({ success: true, activity });
});

exports.getActivitiesByTask = catchAsyncErrors(async (req, res, next) => {
  const { taskId, chatId } = req.query;

  if (!chatId || !taskId) {
    return next(new ErrorHandler("All required parameters not Provided", 400));
  }

  const activity = await Activity.find({ chatId: chatId, taskId: taskId }).sort(
    "-createdAt"
  );

  if (activity.length === 0) {
    res
      .status(200)
      .json({ success: true, message: "No Activity available yet" });
  }

  res.status(200).json({ success: true, activity });
});
