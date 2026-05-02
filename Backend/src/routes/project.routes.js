const express = require("express");
const { body } = require("express-validator");
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require("../controllers/project.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// All project routes require authentication
router.use(protect);

const projectValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Project title is required")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),
];

router.route("/").get(getProjects).post(projectValidation, createProject);

router.route("/:id").get(getProject).put(updateProject).delete(deleteProject);

router.route("/:id/members").post(addMember);
router.route("/:id/members/:userId").delete(removeMember);

module.exports = router;
