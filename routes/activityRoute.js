const express = require("express");
const router = express.Router();

const {
  isAuthenticatedUser,
  checkDeactivated,
} = require("../middlewares/auth");
const {
  getAllActivities,
  getActivitiesByTask,
} = require("../controllers/activityController");

router.route("/").get(isAuthenticatedUser, checkDeactivated, getAllActivities);
router
  .route("/task")
  .get(isAuthenticatedUser, checkDeactivated, getActivitiesByTask);

module.exports = router;
