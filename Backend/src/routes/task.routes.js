const express = require("express");
const { body } = require("express-validator");
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// All task routes require authentication
router.use(protect);

const taskValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),
  body("projectId").notEmpty().withMessage("Project ID is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("dueDate").optional().isISO8601().withMessage("Invalid date format"),
];

router.route("/").get(getTasks).post(taskValidation, createTask);

router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

router.patch("/:id/status", updateTaskStatus);
router.patch("/:id/assign", assignTask);

module.exports = router;
