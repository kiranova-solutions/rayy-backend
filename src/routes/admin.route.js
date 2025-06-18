const router = require("express").Router();

// will move to .env
const ADMIN_USER = "admin@rayy.online";
const ADMIN_PASSWORD = "admin@123";

const REFRESH_TOKEN_PRIVATE_KEY = "refreshToken";
const ACCESS_TOKEN_PRIVATE_KEY = "accessToken";
const jwt = require("jsonwebtoken");

const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000;
const threeMonthsInMillis = 3 * 30 * 24 * 60 * 60 * 1000;

const optionsAccessTokenJWT = {
  expires: new Date(Date.now() + oneWeekInMillis),
  httpOnly: true,
  secure: true,
};

const optionsRefreshTokenJWT = {
  expires: new Date(Date.now() + threeMonthsInMillis),
  httpOnly: true,
  secure: true,
};

const generateAccessToken = (data) => {
  try {
    const token = jwt.sign(data, ACCESS_TOKEN_PRIVATE_KEY, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.log("Error: ", error);
  }
};

const generateRefreshToken = (data) => {
  try {
    const token = jwt.sign(data, REFRESH_TOKEN_PRIVATE_KEY, {
      expiresIn: "90d",
    });
    return token;
  } catch (error) {
    console.log("Error: ", error);
  }
};

const adminLoginController = async (req, res) => {
  try {
    // Get email and password from request body
    const { email, password } = req.body;

    // Check if email or password is missing
    if (!email || !password) {
      // Return 400 Bad Request status code with error message
      return res.status(400).json({
        success: false,
        message: `Please Fill up All the Required Fields`,
      });
    }
    if (email !== ADMIN_USER) {
      return res.status(401).json({
        success: false,
        message: `Email is incorrect`,
      });
    }
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      });
    }
    // Generate JWT token and Compare Password

    const payload = { id: "admin", email: email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const user = {
      _id: "admin",
      email: "admin",
      firstName: "admin",
      lastName: "admin",
    };
    // Set cookie for token and return success response
    res
      .cookie("refreshToken", refreshToken, optionsRefreshTokenJWT)
      .cookie("accessToken", accessToken, optionsAccessTokenJWT)
      .status(200)
      .json({
        user,
        message: `User Login Success`,
      });
  } catch (error) {
    // Return 500 Internal Server Error status code with error message
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: `Login Failure Please Try Again`,
    });
  }
};

// This api will check the refreshToken validity and generate a new access token
const refreshAccessTokenController = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    return res.status(401).json({
      success: false,
      message: `Refresh token in cookie is required`,
    });
  }

  const refreshToken = cookies.refreshToken;

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_PRIVATE_KEY);

    const id = decoded.id;
    const email = decoded.email;

    const accessToken = generateAccessToken({ id, email });

    return res.status(201).json({
      success: true,
      accessToken: accessToken,
    });
  } catch (e) {
    console.log(e);
    return res.status(401).json({
      success: false,
      message: `Invalid refresh token`,
    });
  }
};

const logoutController = (req, res) => {
  // Loop through all cookies in the request and clear them
  Object.keys(req.cookies).forEach((cookie) => {
    res.clearCookie(cookie); // Remove each cookie
  });

  res.send("All cookies have been cleared!");
};

// Get Profile Controller
const getAdminProfileController = async (req, res) => {
  try {
    const user = {
      _id: "admin",
      email: "admin",
      firstName: "admin",
      lastName: "admin",
    };
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Password cannot be changed. Please try again.",
    });
  }
};

const { auth } = require("../middlewares/auth");

router.post("/login-admin", adminLoginController);

// refresh Access Token route
router.get("/refresh", refreshAccessTokenController);
router.get("/admin-profile", auth, getAdminProfileController);
// logout route
router.post("/logout", logoutController);

module.exports = router;
