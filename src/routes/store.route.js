const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const storeController = require("../controllers/store.controller");

// ------------ for vendor side router -----------

router.get("/byUser", authMiddleware, storeController.getStoreByUserId);
router.post("/create", authMiddleware, storeController.createStore);
router.post("/createAdminStore", storeController.createAdminStore);

router.get("/", storeController.getStores);
router.get("/getById", authMiddleware, storeController.getStoreById);
router.get("/getAdminStoreById/:id", storeController.getAdminStoreById);
router.get("/getAvailableSlots/:id", storeController.getAvailableSlots);

router.put("/", authMiddleware, storeController.updateStore);
router.put("/byAdmin/:userId", storeController.updateStoreByAdmin);

// router.delete("/:id", authMiddleware, storeController.deleteStore);

// ------------ for client product router -----------
router.get("/get-store-list", storeController.getStoreList);
router.get("/get-store-and-service", storeController.getStoreAndService);
router.get("/search-store", storeController.searchStore);
router.post("/search-store-by-category", storeController.searchStoreByCategory);

module.exports = router;
