const { validationResult } = require("express-validator");
const Task = require("../models/task.model");
const Project = require("../models/project.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Helper: check if user is project member
const isProjectMember = (project, userId) =>
  project.members.some((m) => m.toString() === userId.toString());

// @desc    Create task
// @route   POST /api/v1/tasks
// @access  Protected (project admin)
const createTask = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { title, description, priority, projectId, assignedTo, dueDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  if (project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only project admin can create tasks");
  }

  // If assigning to someone, check they are a member
  if (assignedTo) {
    const isMember = isProjectMember(project, assignedTo);
    if (!isMember) throw new ApiError(400, "Assigned user is not a project member");
  }

  const task = await Task.create({
    title,
    description,
    priority,
    project: projectId,
    assignedTo: assignedTo || null,
    createdBy: req.user._id,
    dueDate: dueDate || null,
  });

  await task.populate([
    { path: "assignedTo", select: "name email" },
    { path: "createdBy", select: "name email" },
    { path: "project", select: "title" },
  ]);

  res.status(201).json(new ApiResponse(201, { task }, "Task created successfully"));
});

// @desc    Get tasks (filter by project, status, priority)
// @route   GET /api/v1/tasks
// @access  Protected
const getTasks = asyncHandler(async (req, res) => {
  const { projectId, status, priority, assignedTo } = req.query;

  const filter = {};

  // Only show tasks in projects the user is a member of
  const userProjects = await Project.find({ members: req.user._id }).select("_id");
  const projectIds = userProjects.map((p) => p._id);

  if (projectId) {
    if (!projectIds.some((id) => id.toString() === projectId)) {
      throw new ApiError(403, "Access denied to this project");
    }
    filter.project = projectId;
  } else {
    filter.project = { $in: projectIds };
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  // Auto-update overdue status
  await Task.updateMany(
    {
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $nin: ["done", "overdue"] },
    },
    { status: "overdue" }
  );

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, { tasks, count: tasks.length }, "Tasks fetched"));
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Protected
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title members admin");

  if (!task) throw new ApiError(404, "Task not found");

  const isMember = isProjectMember(task.project, req.user._id);
  if (!isMember) throw new ApiError(403, "Access denied");

  res.status(200).json(new ApiResponse(200, { task }, "Task fetched"));
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Admin or Assignee
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate("project", "admin members");
  if (!task) throw new ApiError(404, "Task not found");

  const isAdmin = task.project.admin.toString() === req.user._id.toString();
  const isAssignee =
    task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee) {
    throw new ApiError(403, "Only project admin or task assignee can update this task");
  }

  const { title, description, priority, dueDate } = req.body;

  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    { title, description, priority, dueDate },
    { new: true, runValidators: true }
  )
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title");

  res.status(200).json(new ApiResponse(200, { task: updated }, "Task updated"));
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Project admin only
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate("project", "admin");
  if (!task) throw new ApiError(404, "Task not found");

  if (task.project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only project admin can delete tasks");
  }

  await Task.findByIdAndDelete(req.params.id);

  res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

// @desc    Update task status
// @route   PATCH /api/v1/tasks/:id/status
// @access  Admin or Assignee
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["todo", "in-progress", "done", "overdue"];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${validStatuses.join(", ")}`);
  }

  const task = await Task.findById(req.params.id).populate("project", "admin members");
  if (!task) throw new ApiError(404, "Task not found");

  const isAdmin = task.project.admin.toString() === req.user._id.toString();
  const isAssignee =
    task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee) {
    throw new ApiError(403, "Only project admin or task assignee can change status");
  }

  task.status = status;
  await task.save();

  res.status(200).json(new ApiResponse(200, { task }, "Task status updated"));
});

// @desc    Assign task to a member
// @route   PATCH /api/v1/tasks/:id/assign
// @access  Project admin only
const assignTask = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const task = await Task.findById(req.params.id).populate("project", "admin members");
  if (!task) throw new ApiError(404, "Task not found");

  if (task.project.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only project admin can assign tasks");
  }

  if (userId && !isProjectMember(task.project, userId)) {
    throw new ApiError(400, "User is not a project member");
  }

  task.assignedTo = userId || null;
  await task.save();
  await task.populate("assignedTo", "name email");

  res.status(200).json(new ApiResponse(200, { task }, "Task assigned successfully"));
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
};
