const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const cors = require("cors");
const platformRoutes = require("./src/routes");
const app = express();
const database = require("./src/config/database");
const cookieParser = require("cookie-parser");

//Middleware setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://master.d3durrnlwknxj3.amplifyapp.com",
      "https://admin.rayy.online",
      "https://uat.d3durrnlwknxj3.amplifyapp.com",
    ], // Add multiple allowed origins

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Explicitly include OPTIONS method
    allowedHeaders: ["Content-Type", "Authorization"], // Specify headers that are allowed
  })
);

app.use(cookieParser());
app.use(express.static("front"));
app.use(express.json({ limit: "50mb" })); // ✅ This is enough
app.use(express.urlencoded({ limit: "50mb", extended: true })); // ✅ Already included
app.use(logger("dev"));

app.use("/api/v1", platformRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the platform 🚀🚀 ");
});

const port = process.env.PORT || 8000;

// Connecting to database
database.connect();

app.listen(port, () => {
  console.log(`🚀🚀 Server is running at http://localhost:${port} 🚀🚀`);
});

module.exports = app;
