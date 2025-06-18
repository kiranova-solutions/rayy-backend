const express = require("express");
const router = express.Router();
const userRoute = require("./user.route");
const s3Route = require("./s3.route");
const staffRoute = require("./staff.route");
const appointmentRoute = require("./appointment.route");
const storeRoute = require("./store.route");
const serviceRoute = require("./service.route");
const staffScheduleRoute = require("./staff.schedule.route");
const cartRoute = require("./cart.route");
const queryRoute = require("./query.routes");
const ratingRoute = require("./rating.route");
const bannerRoute = require("./banner.route");
const eventRoute = require("./event.route");

const defaultRoutes = [
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/s3",
    route: s3Route,
  },
  {
    path: "/staff",
    route: staffRoute,
  },
  {
    path: "/appointment",
    route: appointmentRoute,
  },
  {
    path: "/store",
    route: storeRoute,
  },
  {
    path: "/service",
    route: serviceRoute,
  },
  {
    path: "/staffSchedule",
    route: staffScheduleRoute,
  },
  { path: "/cart", route: cartRoute },
  { path: "/query", route: queryRoute },
  { path: "/rating", route: ratingRoute },
  {
    path: "/admin",
    route: require("./admin.route"),
  },
  {
    path: "/banner",
    route: require("./banner.route"),
  },
  {
    path: "/events",
    route: eventRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
