const jwt = require("jsonwebtoken");
// const Token = require("../models/token.model");

module.exports = async (req, res, next) => {
  try {
    // console.log("token", req.headers.authorization);
    const skipRoutes = ["/use-later"];

    console.log("path----------", req.path);
    if (skipRoutes.includes(req.path)) {
      return next(); // Skip validation for these routes
    }
    if (!req.headers.authorization) {
      return res.status(403).send({ message: "No token provided" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decryptedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    // const checkSession = await Token.findOne({ id: decryptedToken.userId });
    // if (checkSession && checkSession.activeToken !== token) {
    //   return res.status(403).json({
    //     message:
    //       "Logged in on another device.Only one session per user is allowed",
    //   });
    // }
    req.body.userId = decryptedToken.userId;
    req.userId = decryptedToken.userId;

    // console.log("-----auth-----done-----");
    next();
  } catch (error) {
    console.log("-----auth-----error---", error);
    res.status(403).send({
      success: false,
      message: error.message,
    });
  }
};
