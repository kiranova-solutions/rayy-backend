const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const serviceController = require("../controllers/service.controller");
const serviceProductController = require("../controllers/serviceProduct.controller");

router.get(
  "/",
  authMiddleware,
  serviceController.getAllServicesWithoutServiceType
);

router.get("/byAdmin", serviceController.getAllServicesByAdmin);

router.get(
  "/store/:storeId",
  authMiddleware,
  serviceController.getAllServicesByStoreId
);

router.get(
  "/byAdmin/store/:storeId",
  serviceController.getAllServicesByStoreIdByAdmin
);

// ------------ for vendor side router -----------
router.get(
  "/get-list/:serviceType",
  authMiddleware,
  serviceController.getAllServices
);
router.get(
  "/get-service/:id",
  authMiddleware,
  serviceController.getServiceById
);

router.get(
  "/get-service-by-admin/:id",
  serviceController.getServiceByIdByAdmin
);

router.post("/", authMiddleware, serviceController.createService);
router.post("/byAdmin", serviceController.createServiceByAdmin);

router.put("/byAdmin/:id", serviceController.updateServiceByAdmin);
router.put("/:id", serviceController.updateService);

router.put(
  "/toggle-status/:id",
  authMiddleware,
  serviceController.toggleServiceStatus
);

router.put(
  "/toggle-best-seller/:id",
  authMiddleware,
  serviceController.toggleServiceIsBestSelling
);

//  ------------ for service product router -----------
router.post(
  "/create-product",
  authMiddleware,
  serviceProductController.createProduct
);
router.get(
  "/get-products",
  authMiddleware,
  serviceProductController.getAllProducts
);

// ------------ for Client router -----------

router.get("/get-service-list", serviceController.getServiceForClient);

router.delete("/:id", serviceController.deleteServiceById);

module.exports = router;
