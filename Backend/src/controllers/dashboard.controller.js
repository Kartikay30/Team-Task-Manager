const Project = require("../models/project.model");
const Task = require("../models/task.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Get dashboard stats for logged-in user
// @route   GET /api/v1/dashboard/stats
// @access  Protected
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get projects user belongs to
  const userProjects = await Project.find({ members: req.user._id }).select("_id title");
  const projectIds = userProjects.map((p) => p._id);

  // Auto-update overdue tasks first
  await Task.updateMany(
    {
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $nin: ["done", "overdue"] },
    },
    { status: "overdue" }
  );

  // Aggregate task counts by status
  const taskStats = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // Format into object
  const stats = { todo: 0, "in-progress": 0, done: 0, overdue: 0 };
  taskStats.forEach((s) => {
    stats[s._id] = s.count;
  });

  const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);
  const completionRate =
    totalTasks > 0 ? Math.round((stats.done / totalTasks) * 100) : 0;

  // Get recent overdue tasks
  const overdueTasks = await Task.find({
    project: { $in: projectIds },
    status: "overdue",
  })
    .populate("project", "title")
    .populate("assignedTo", "name email")
    .sort({ dueDate: 1 })
    .limit(5);

  // Get my assigned tasks
  const myTasks = await Task.find({
    assignedTo: req.user._id,
    status: { $ne: "done" },
  })
    .populate("project", "title")
    .sort({ dueDate: 1 })
    .limit(10);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        projectCount: userProjects.length,
        taskStats: stats,
        totalTasks,
        completionRate,
        overdueTasks,
        myTasks,
      },
      "Dashboard stats fetched"
    )
  );
});

module.exports = { getDashboardStats };
