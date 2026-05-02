const { validationResult } = require("express-validator");
const Project = require("../models/project.model");
const User = require("../models/user.model");
const Task = require("../models/task.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Create project
// @route   POST /api/v1/projects
// @access  Admin
const createProject = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { title, description } = req.body;

  const project = await Project.create({
    title,
    description,
    admin: req.user._id,
    members: [req.user._id],
  });

  await project.populate("admin", "name email role");

  res
    .status(201)
    .json(new ApiResponse(201, { project }, "Project created successfully"));
});

// @desc    Get all projects for logged-in user
// @route   GET /api/v1/projects
// @access  Protected
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id })
    .populate("admin", "name email")
    .populate("members", "name email role")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, { projects, count: projects.length }, "Projects fetched"));
});

// @desc    Get single project
// @route   GET /api/v1/projects/:id
// @access  Protected (must be member)
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("admin", "name email role")
    .populate("members", "name email role");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is a member
  const isMember = project.members.some(
    (m) => m._id.toString() === req.user._id.toString()
  );
  if (!isMember) {
    throw new ApiError(403, "You are not a member of this project");
  }

  res.status(200).json(new ApiResponse(200, { project }, "Project fetched"));
});

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Admin (project admin only)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the project admin can update this project");
  }

  const { title, description, status } = req.body;
  const updated = await Project.findByIdAndUpdate(
    req.params.id,
    { title, description, status },
    { new: true, runValidators: true }
  )
    .populate("admin", "name email")
    .populate("members", "name email role");

  res.status(200).json(new ApiResponse(200, { project: updated }, "Project updated"));
});

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Admin (project admin only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the project admin can delete this project");
  }

  // Delete all tasks in this project
  await Task.deleteMany({ project: req.params.id });
  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json(new ApiResponse(200, {}, "Project deleted successfully"));
});

// @desc    Add member to project
// @route   POST /api/v1/projects/:id/members
// @access  Admin (project admin only)
const addMember = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  if (project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the project admin can add members");
  }

  const userToAdd = await User.findOne({ email });
  if (!userToAdd) throw new ApiError(404, "No user found with that email");

  const alreadyMember = project.members.some(
    (m) => m.toString() === userToAdd._id.toString()
  );
  if (alreadyMember) throw new ApiError(400, "User is already a member");

  project.members.push(userToAdd._id);
  await project.save();

  await project.populate("members", "name email role");

  res.status(200).json(new ApiResponse(200, { project }, "Member added successfully"));
});

// @desc    Remove member from project
// @route   DELETE /api/v1/projects/:id/members/:userId
// @access  Admin (project admin only)
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  if (project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the project admin can remove members");
  }

  if (req.params.userId === project.admin.toString()) {
    throw new ApiError(400, "Cannot remove the project admin");
  }

  project.members = project.members.filter(
    (m) => m.toString() !== req.params.userId
  );
  await project.save();

  res.status(200).json(new ApiResponse(200, {}, "Member removed successfully"));
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
