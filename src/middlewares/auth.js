/* eslint-disable no-unused-vars */
// Importing required modules
const jwt = require("jsonwebtoken");

// will move to .env
const REFRESH_TOKEN_PRIVATE_KEY = "refreshToken";
const ACCESS_TOKEN_PRIVATE_KEY = "accessToken";

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

// This function is used as middleware to authenticate user requests
exports.auth = async (req, res, next) => {
  try {
    // Extracting JWT from request cookies, body or header
    const cookieHeader = req.headers.cookie;

    // If JWT is missing, return 401 Unauthorized response
    if (!cookieHeader) {
      return res.status(401).json({ success: false, message: `Token Missing` });
    }
    let accessToken;
    let refreshToken;
    try {
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ");

        for (const cookie of cookies) {
          const [name, value] = cookie.split("=");
          if (name === "accessToken") {
            accessToken = value;
            break;
          }
          if (name === "refreshToken") {
            refreshToken = value;
          }
        }
      }
      if (!accessToken) {
        const decode = await jwt.verify(
          refreshToken,
          REFRESH_TOKEN_PRIVATE_KEY
        );
        const payload = { id: decode._id, email: decode.email };

        accessToken = generateAccessToken(payload);
        refreshToken = generateRefreshToken(payload);

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
        res
          .cookie("refreshToken", refreshToken, optionsRefreshTokenJWT)
          .cookie("accessToken", accessToken, optionsAccessTokenJWT);

        req.userDecode = decode;
      } else {
        // Verifying the JWT using the secret key stored in environment variables
        const decode = await jwt.verify(accessToken, ACCESS_TOKEN_PRIVATE_KEY);
        // Storing the decoded JWT payload in the request object for further use
        req.userDecode = decode;
      }
    } catch (error) {
      // If JWT verification fails, return 401 Unauthorized response

      return res
        .status(401)
        .json({ success: false, message: "token is invalid" });
    }

    // If JWT is valid, move on to the next middleware or request handler
    next();
  } catch (error) {
    // If there is an error during the authentication process, return 401 Unauthorized response
    return res.status(401).json({
      success: false,
      message: `Something Went Wrong While Validating the Token`,
    });
  }
};
