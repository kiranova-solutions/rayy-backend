const Service = require("../models/service.model");
const Store = require("../models/store.model");
const User = require("../models/user.model");

const getAllServicesByAdmin = async (req, res) => {
  try {
    const services = await Service.find()
      .populate({
        path: "storeId",
        populate: {
          path: "userId", // Populating userId inside storeId
          select: "fullName email phone", // Select specific fields if needed
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const userId = req.userId;
    console.log("serviceType", { serviceType, userId });
    const services = await Service.find({ userId, serviceType: serviceType });
    res.status(200).json({
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: error.message });
  }
};

const getAllServicesWithoutServiceType = async (req, res) => {
  try {
    const userId = req.userId;
    const services = await Service.find({ userId });

    res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    console.log(service.product); // Check what the product array looks like

    const productCategory = [
      "Organic",
      "Sulfate-Free",
      "Paraben-Free",
      "Cruelty-Free",
      "Vegan",
    ];

    // const data = productCategory.map((category) => {
    //   const filteredProducts = service.product.filter(
    //     (p) => p.productType === category
    //   );
    //   console.log(`Category: ${category}, Products:`, filteredProducts); // Debugging
    //   return {
    //     category,
    //     products: filteredProducts,
    //   };
    // });

    // console.log(data); // Final structure check

    res.status(200).json({ data: service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServiceByIdByAdmin = async (req, res) => {
  try {
    // Find the service by ID
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    console.log(service.product); // Debugging: Log product array

    // Find the corresponding store using storeId
    const store = await Store.findById(service.storeId);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Find the user using userId from the store
    const user = await User.findById(store.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare response data
    const responseData = {
      service,
      store,
      user, // Include user details
    };

    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ success: false, message: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const userId = req.userId;
    const store = await Store.findOne({ userId: userId });

    req.body.storeId = store._id;
    // console.log("req.body", req.body);
    const service = await Service.create(req.body);
    res.status(201).json({ store, userId, service });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: error.message });
  }
};

const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    service.isActive = !service.isActive;
    await service.save();
    res.status(200).json({ data: service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleServiceIsBestSelling = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    service.isBestSeller = !service.isBestSeller;
    await service.save();
    res.status(200).json({ data: service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServiceForClient = async (req, res) => {
  try {
    const { search } = req.query;

    const query = {
      isActive: true,
    };

    // Only add search conditions if search is not an empty string
    if (search && search.trim() !== "") {
      query.$or = [
        { serviceName: { $regex: search, $options: "i" } }, // Search in service name
        { city: { $regex: search, $options: "i" } }, // Search in city
        { category: { $regex: search, $options: "i" } }, // Search in category
        { subCategories: { $regex: search, $options: "i" } }, // Search in subCategories array
      ];
    }
    const services = await Service.find(query);

    res.status(200).json({ data: services, message: "Success Done" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllServicesByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find the store by storeId
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    // Extract userId from store
    const userId = store.userId;

    // Find all services associated with the userId
    const services = await Service.find({ userId, isActive: true });

    res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createServiceByAdmin = async (req, res) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res
        .status(400)
        .json({ success: false, message: "Store ID is required" });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    req.body.userId = store.userId; // Append userId from store

    const service = await Service.create(req.body);
    res.status(201).json({ success: true, store, service });
  } catch (error) {
    console.error({ error });
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    await Service.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllServicesByStoreIdByAdmin = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find the store by storeId
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    // Extract userId from store
    const userId = store.userId;

    // Find all services associated with the userId
    const services = await Service.find({ storeId });

    res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateServiceByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("updateServiceByAdmin: ", id);

    // Step 1: Extract storeId from the service
    const storeId = req.body.storeId;
    if (!storeId) {
      return res
        .status(400)
        .json({ success: false, message: "Store ID is required" });
    }

    // Step 2: Find the store by storeId
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    // Step 3: Append userId from store to request body
    req.body.userId = store.userId;

    // Step 4: Update the service
    const updatedService = await Service.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json({ success: true, data: updatedService });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllServices,
  updateService,
  getServiceById,
  createService,
  toggleServiceStatus,
  getAllServicesWithoutServiceType,
  getServiceForClient,
  getAllServicesByStoreId,
  getAllServicesByAdmin,
  getServiceByIdByAdmin,
  createServiceByAdmin,
  deleteServiceById,
  getAllServicesByStoreIdByAdmin,
  updateServiceByAdmin,
  toggleServiceIsBestSelling,
};
