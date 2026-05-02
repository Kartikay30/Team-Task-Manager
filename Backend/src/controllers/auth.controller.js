const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Set cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Create user
  const user = await User.create({ name, email, password, role });

  const token = generateToken(user._id);

  res
    .cookie("token", token, cookieOptions)
    .status(201)
    .json(
      new ApiResponse(201, { user, token }, "Account created successfully")
    );
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);

  res
    .cookie("token", token, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, { user, token }, "Logged in successfully"));
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Protected
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json(new ApiResponse(200, { user }, "User fetched"));
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Protected
const logout = asyncHandler(async (req, res) => {
  res
    .cookie("token", "", { ...cookieOptions, maxAge: 0 })
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// @desc    Update profile
// @route   PUT /api/v1/auth/profile
// @access  Protected
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name },
    { new: true, runValidators: true }
  );
  res.status(200).json(new ApiResponse(200, { user }, "Profile updated"));
});

module.exports = { register, login, getMe, logout, updateProfile };
