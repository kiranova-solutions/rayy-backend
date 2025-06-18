const Store = require("../models/store.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const StaffSchedule = require("../models/staff.schedule.model");
const VendorSchedule = require("../models/vendor.schedule.model");
const moment = require("moment-timezone");
const storeModel = require("../models/store.model");

const createStore = async (req, res) => {
  console.log("---------createStore---------");
  try {
    const {
      companyName,
      logo,
      storeImages,
      location,
      selectedDays,
      selectedTimes,
      categories,
      storeOpenTime,
      storeCloseTime,
      latitude,
      longitude,
    } = req.body;

    console.log({ reqBody: req.body });
    const userId = req.userId; // Get userId from middleware

    const store = new Store({
      userId,
      companyName,
      companyLogo: logo,
      storeImage: storeImages,
      storeLocation: location,
      storeCategory: categories,
      storeOpenDays: selectedDays,
      storeSlots: selectedTimes,
      storeOpenTime,
      storeCloseTime,
      latitude,
      longitude,
    });

    await store.save();

    console.log({ store });
    res.status(201).json({
      status: "success",
      message: "Store created successfully",
      data: store,
    });
  } catch (err) {
    console.log("---------createStore---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const createAdminStore = async (req, res) => {
  console.log("---------createStore---------");
  try {
    const {
      userId,
      companyName,
      companyLogo,
      storeImages,
      location,
      selectedDays,
      selectedTimes,
      categories,
      storeOpenTime,
      storeCloseTime,
      latitude,
      longitude,
    } = req.body;

    console.log({ reqBody: req.body });

    const store = new Store({
      userId,
      companyName,
      companyLogo: companyLogo,
      storeImage: storeImages,
      storeLocation: location,
      storeCategory: categories,
      storeOpenDays: selectedDays,
      storeSlots: selectedTimes,
      storeOpenTime,
      storeCloseTime,
      latitude,
      longitude,
    });

    await store.save();

    console.log({ store });
    res.status(201).json({
      status: "success",
      message: "Store created successfully",
      data: store,
    });
  } catch (err) {
    console.log("---------createStore---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json({
      status: "success",
      data: stores,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getStoreById = async (req, res) => {
  console.log({ getById: req.userId });

  try {
    console.log("---------getStoreById---------");
    const userId = req.userId; // Get userId from middleware

    const store = await Store.findOne({ userId });

    console.log({ store });

    if (!store) {
      return res.status(404).json({
        status: "fail",
        message: "Store not found",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      data: store,
    });
  } catch (err) {
    console.log("---------getStoreById---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getAdminStoreById = async (req, res) => {
  const userId = req.params.id;

  try {
    console.log("---------getStoreById---------");
    console.log(userId);

    const store = await Store.findOne({ userId });

    console.log({ store });

    if (!store) {
      return res.status(404).json({
        status: "fail",
        message: "Store not found",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      data: store,
    });
  } catch (err) {
    console.log("---------getStoreById---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const updateStore = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware
    const store = await Store.findOne({ userId });

    if (!store) {
      return res.status(404).json({
        status: "fail",
        message: "Store not found",
      });
    }
    store.companyName = req.body.companyName;
    store.companyLogo = req.body.logo;
    store.storeImage = req.body.storeImages;
    store.storeLocation = req.body.location;
    store.storeCategory = req.body.categories;
    store.storeOpenDays = req.body.selectedDays;
    store.storeSlots = req.body.selectedTimes;
    store.storeOpenTime = req.body.storeOpenTime;
    store.storeCloseTime = req.body.storeCloseTime;
    store.latitude = req.body.latitude;
    store.longitude = req.body.longitude;

    await store.save();
    res.status(200).json({
      status: "success",
      message: "Store updated successfully",
      data: store,
    });
  } catch (err) {
    console.log("---------updateStore---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getStoreList = async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 1000;
    const query = {};

    // Apply search filter if search query is provided
    if (search && search.trim() !== "") {
      query.companyName = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Fetch paginated results
    const stores = await Store.find(query)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Get total count for pagination metadata
    const totalStores = await Store.countDocuments(query);

    res.status(200).json({
      totalStores,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalStores / limitNumber),
      totalStores,
      data: stores,
    });
  } catch (err) {
    console.log("---------getStoreList---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

function groupServicesBySubCategory(services) {
  const subCategoryMap = {};

  services.forEach((service) => {
    service.subCategories.forEach((subCategory) => {
      if (!subCategoryMap[subCategory]) {
        subCategoryMap[subCategory] = {
          title: subCategory,
          services: [],
        };
      }
      subCategoryMap[subCategory].services.push(service);
    });
  });

  return Object.values(subCategoryMap);
}

const getProductTransformer = (product) => {
  const productCategory = [
    "Organic",
    "Sulfate-Free",
    "Paraben-Free",
    "Cruelty-Free",
    "Vegan",
  ];
  const data = productCategory.map((category) => {
    return {
      category,
      products: product.filter((product) => product.productType === category),
    };
  });
  console.log("--------", { data });
  return data;
};

const findStoresWithinRadius = async (userLat, userLng, radiusInKm, query) => {
  const radius = parseFloat(radiusInKm);
  const lat = parseFloat(userLat);
  const lng = parseFloat(userLng);

  const result = await Store.aggregate([
    {
      // 👇 Inject your custom query here
      $match: query,
    },
    {
      $addFields: {
        latNum: { $toDouble: "$latitude" },
        lngNum: { $toDouble: "$longitude" },
      },
    },
    {
      $addFields: {
        distance: {
          $let: {
            vars: {
              r: 6371, // fixed: lowercase variable
              dLat: {
                $multiply: [{ $subtract: ["$latNum", lat] }, Math.PI / 180],
              },
              dLon: {
                $multiply: [{ $subtract: ["$lngNum", lng] }, Math.PI / 180],
              },
              lat1Rad: { $multiply: [lat, Math.PI / 180] },
              lat2Rad: { $multiply: ["$latNum", Math.PI / 180] },
            },
            in: {
              $multiply: [
                "$$r",
                {
                  $multiply: [
                    2,
                    {
                      $atan2: [
                        {
                          $sqrt: {
                            $add: [
                              {
                                $pow: [{ $sin: { $divide: ["$$dLat", 2] } }, 2],
                              },
                              {
                                $multiply: [
                                  { $cos: "$$lat1Rad" },
                                  { $cos: "$$lat2Rad" },
                                  {
                                    $pow: [
                                      { $sin: { $divide: ["$$dLon", 2] } },
                                      2,
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        },
                        {
                          $sqrt: {
                            $subtract: [
                              1,
                              {
                                $add: [
                                  {
                                    $pow: [
                                      { $sin: { $divide: ["$$dLat", 2] } },
                                      2,
                                    ],
                                  },
                                  {
                                    $multiply: [
                                      { $cos: "$$lat1Rad" },
                                      { $cos: "$$lat2Rad" },
                                      {
                                        $pow: [
                                          { $sin: { $divide: ["$$dLon", 2] } },
                                          2,
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $match: {
        distance: { $lte: radius },
      },
    },
  ]);

  return result;
};

const getStoreAndService = async (req, res) => {
  try {
    const { storeId } = req.query;

    const store = await Store.findOne({ _id: storeId });
    const services = await Service.find({
      userId: store?.userId,
      isActive: true,
    });

    const allClubTogetherIds = new Set();
    services.forEach((service) => {
      (service.clubTogetherWith || []).forEach((id) =>
        allClubTogetherIds.add(id)
      );
    });

    // Convert Set to Array
    const extraServices = await Service.find({
      _id: { $in: Array.from(allClubTogetherIds) },
    });

    // Merge both sets of services
    const allServices = [...services, ...extraServices];

    // Create lookup map
    const servicesMap = new Map();
    allServices.forEach((service) => {
      servicesMap.set(String(service._id), service);
    });

    const data = services.map((service) => {
      const plainService = service.toObject();
      const clubWithTogetherServices = (plainService.clubTogetherWith || [])
        .map((id) => {
          const relatedService = servicesMap.get(String(id));
          return relatedService
            ? {
                _id: relatedService._id,
                name: relatedService.name,
                price: relatedService.price,
              }
            : null;
        })
        .filter(Boolean); // remove nulls

      return {
        ...plainService,
        productsTransform: getProductTransformer(plainService.product),
        clubWithTogetherServices,
      };
    });

    const servicesBySubCategory = groupServicesBySubCategory(data);

    res.status(200).json({
      store,
      services: data,
      servicesBySubCategory,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const searchStore = async (req, res) => {
  try {
    const { search } = req.query;

    const query = {};
    let serviceStoreIds = [];

    if (search && search.trim() !== "") {
      // Find services whose name matches search term
      const matchingServices = await Service.find({
        isActive: true, // This is the AND condition
        $or: [
          { name: { $regex: search, $options: "i" } },
          { subCategories: { $regex: search, $options: "i" } },
        ],
      });

      console.log("matchingServices", matchingServices);

      // Extract unique storeIds from those services
      serviceStoreIds = [
        ...new Set(
          matchingServices.map((service) => service.storeId.toString())
        ),
      ];

      // Add search conditions for Store fields
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { storeCategory: { $regex: search, $options: "i" } },
        { storeLocation: { $regex: search, $options: "i" } },
        { _id: { $in: serviceStoreIds } }, // Match stores by IDs from service match
      ];
    }

    const stores = await Store.find(query);

    res.status(200).json({
      status: "success",
      data: stores,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const searchStoreByCategory = async (req, res) => {
  try {
    const { search } = req.query;
    console.log({ search });
    const { filter, latitude, longitude } = req.body;
    console.log({ filter });

    const query = {};
    let serviceStoreIds = [];

    if (search && search.trim() !== "") {
      // Find services whose name matches search term
      const matchingServices = await Service.find({
        isActive: true, // This is the AND condition
        $or: [
          { name: { $regex: search, $options: "i" } },
          { subCategories: { $regex: search, $options: "i" } },
        ],
      });

      console.log("matchingServices", matchingServices);

      // Extract unique storeIds from those services
      serviceStoreIds = [
        ...new Set(
          matchingServices.map((service) => service.storeId.toString())
        ),
      ];

      // Add search conditions for Store fields
    }

    query.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { storeCategory: { $regex: search, $options: "i" } },
      { storeLocation: { $regex: search, $options: "i" } },
      { _id: { $in: serviceStoreIds } }, // Match stores by IDs from service match
    ];

    // Handle isZorainVerified filter
    if (filter?.isZorainVerified && Array.isArray(filter.isZorainVerified) && filter.isZorainVerified.includes('isZorainVerified')) {
      query.isZorainVerified = true;
    }

    const rad = filter?.distance ? +filter?.distance : 1000000000000;
    let stores = await findStoresWithinRadius(
      +latitude,
      +longitude,
      rad,
      query
    );

    // const stores = await Store.find(query);
    let priceRange = {
      min: 0,
      max: 1000000000000,
    };
    if (filter?.price) {
      if (filter.price === "pocket_friendly") {
        priceFilter = true;
        priceRange.min = 0;
        priceRange.max = 1000;
      } else if (filter.price === "trendy_spending") {
        priceFilter = true;
        priceRange.min = 1000;
        priceRange.max = 5000;
      } else if (filter.price === "luxury") {
        console.log("luxury");
        priceFilter = true;
        priceRange.min = 5000;
        priceRange.max = 10000000;
      }
    }
    // Use Promise.all to fetch services for all stores concurrently
    const servicePromises = stores.map(
      async (store) =>
        await Service.find({
          storeId: store._id,
          isActive: true,
          price: { $gte: priceRange.min, $lte: priceRange.max },
        })
    );

    const serviceData = await Promise.all(servicePromises);

    // Step 3: Filter stores based on whether they have a valid service
    let filteredStores = stores;

    filteredStores = stores.filter((store, index) => {
      const services = serviceData[index];
      // if (services.length === 0) {
      //   return false; // Skip if no services
      // }
      if (!filter?.duration || filter?.duration?.length === 0) {
        return true;
      }
      return services.some((service) =>
        filter.duration.includes(service.duration)
      );
    });

    res.status(200).json({
      status: "success",
      stores: stores,
      filteredStores: stores,
      serviceData: serviceData,
      // storesData: storesData,
    });
  } catch (err) {
    console.log("---------searchStoreByCategory---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getStoreByUserId = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware

    const store = await Store.findOne({ userId });

    if (!store) {
      return res.status(404).json({
        status: "fail",
        message: "No store found for this user",
        data: null, // Instead of an empty array, return null
      });
    }

    res.status(200).json({
      status: "success",
      data: store, // Return a single store object
    });
  } catch (err) {
    console.log("---------getStoreByUserId---------", { err });
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const updateStoreByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const updatedStore = await Store.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res
      .status(200)
      .json({ message: "Store updated successfully", store: updatedStore });
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper to check time overlap

const getAvailableSlots = async (req, res) => {
  try {
    console.log("getAvailableSlots");
    const { id: storeId } = req.params;
    const { selectedDate, staffId, serviceId } = req.query;
    console.log("storeId:", storeId, selectedDate, staffId, serviceId);

    if (!selectedDate || !serviceId) {
      return res
        .status(400)
        .json({ error: "selectedDate and serviceId are required" });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const vendorId = store.userId;
    const storeSlots = store.storeSlots;

    const date = moment.tz(selectedDate, "Asia/Kolkata").startOf("day");
    const durationMinutes = parseInt(service.duration.split(" ")[0]); // Example: "30 Minutes"

    console.log(
      "vendorId:",
      vendorId,
      "durationMinutes:",
      durationMinutes,
      "storeSlots:",
      storeSlots
    );

    // Step 1: Build all available slots for the day
    const slots = storeSlots.map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const start = moment
        .tz(date, "Asia/Kolkata")
        .hour(hour)
        .minute(minute)
        .second(0);
      const end = moment(start).add(durationMinutes, "minutes");
      return {
        label: time,
        start: start.toDate(),
        end: end.toDate(),
      };
    });

    console.log("slots:", slots);

    let staffIds = [];

    if (staffId) {
      staffIds = [staffId];
    } else {
      const allStaff = await Staff.find({
        createdBy: vendorId,
        isActive: true,
      });
      staffIds = allStaff.map((staff) => staff._id);
    }

    console.log("staffIds to check schedules for:", staffIds);

    let schedules = [];

    if (staffIds.length > 0) {
      // Step 2: Fetch schedules of staff
      schedules = await StaffSchedule.find({
        staffId: { $in: staffIds },
        isCancelled: false,
        startDateTime: {
          $gte: date.toDate(),
          $lt: moment(date).endOf("day").toDate(),
        },
      });
    } else {
      // No staff available, fallback to VendorSchedule
      console.log("No staff found. Fetching VendorSchedule...");
      schedules = await VendorSchedule.find({
        vendorId,
        isCancelled: false,
        startDateTime: {
          $gte: date.toDate(),
          $lt: moment(date).endOf("day").toDate(),
        },
      });
    }

    console.log("schedules:", schedules);

    // Step 3: Filter slots
    const availableSlots = slots.filter((slot) => {
      if (staffIds.length > 0) {
        // Check against staff schedules
        return staffIds.some((staffId) => {
          const staffSchedules = schedules.filter((s) => s.staffId === staffId);

          const isAvailable = !staffSchedules.some((s) =>
            isOverlap(
              moment(slot.start).tz("Asia/Kolkata").toDate(),
              moment(slot.end).tz("Asia/Kolkata").toDate(),
              moment(s.startDateTime).tz("Asia/Kolkata").toDate(),
              moment(s.endDateTime).tz("Asia/Kolkata").toDate()
            )
          );

          return isAvailable;
        });
      } else {
        // Check against vendor schedules
        const isAvailable = !schedules.some((s) =>
          isOverlap(
            moment(slot.start).tz("Asia/Kolkata").toDate(),
            moment(slot.end).tz("Asia/Kolkata").toDate(),
            moment(s.startDateTime).tz("Asia/Kolkata").toDate(),
            moment(s.endDateTime).tz("Asia/Kolkata").toDate()
          )
        );

        return isAvailable;
      }
    });

    console.log("availableSlots:", availableSlots);

    return res.status(200).json({
      storeId,
      selectedDate,
      staffId,
      serviceId,
      availableSlots: availableSlots.map((s) => s.label),
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to check if two time ranges overlap
function isOverlap(slotStart, slotEnd, bookedStart, bookedEnd) {
  // Add 5 hours 30 minutes to slotStart and slotEnd
  const adjustedSlotStart = moment(slotStart)
    .add(5, "hours")
    .add(30, "minutes")
    .toDate();
  const adjustedSlotEnd = moment(slotEnd)
    .add(5, "hours")
    .add(30, "minutes")
    .toDate();

  console.log(
    "adjustedSlotStart:",
    adjustedSlotStart,
    "adjustedSlotEnd:",
    adjustedSlotEnd
  );
  console.log("bookedStart:", bookedStart, "bookedEnd:", bookedEnd);

  const isOverlapping =
    adjustedSlotStart < bookedEnd && adjustedSlotEnd > bookedStart;

  console.log("isOverlapping:--------------- ", isOverlapping);
  console.log("  ");

  return isOverlapping;
}

module.exports = {
  createStore,
  createAdminStore,
  getStores,
  getStoreById,
  getAdminStoreById,
  updateStore,
  getStoreList,
  getStoreAndService,
  searchStore,
  searchStoreByCategory,
  getStoreByUserId,
  updateStoreByAdmin,
  getAvailableSlots,
};
