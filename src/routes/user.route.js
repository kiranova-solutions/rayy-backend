const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);

router.post("/send-mobile-otp", userController.sendMobileOtp);
router.post("/verify-mobile-otp", userController.verifyMobileOtp);

router.post("/", userController.createUser);

router.get("/", authMiddleware, userController.getUsers);
router.get("/getAdminUsers", userController.getAdminUsers);
router.get("/getClientsByAdmin", userController.getClientsByAdmin);

router.get("/:id", authMiddleware, userController.getUserById);

router.post("/createAdminUsers", userController.createAdminUsers);
router.get("/getAdminUsers/:id", userController.getAdminUserById);

router.put("/", authMiddleware, userController.updateUser);
router.put("/byAdmin/:userId", userController.updateUserByAdmin);

router.delete("/", authMiddleware, userController.deleteUser);
router.delete("/byAdmin/:userId", userController.deleteUserByAdmin);

router.put("/profileImage", authMiddleware, userController.updateProfileImage);

router.post("/update-fcm-token", authMiddleware, userController.updateFcmToken);

router.post("/createClientByAdmin",userController.createClientByAdmin);
router.get("/getAdminClientById/:id",userController.getAdminClientById);
router.put("/updateClientByAdmin/:id",userController.updateClientByAdmin);
router.delete("/deleteClientByAdmin/:id",userController.deleteClientByAdmin);


module.exports = router;
