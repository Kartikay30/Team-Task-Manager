const express = require("express");
const { getDashboardStats } = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/stats", protect, getDashboardStats);

module.exports = router;
