const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URL = process.env.MONGODB_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;

exports.connect = () => {
  mongoose
    .connect(`${MONGODB_URL}${DATABASE_NAME}`)
    .then(console.log(`DB Connection Success----> ${DATABASE_NAME}`))
    .catch((err) => {
      console.log(`DB Connection Failed`);
      console.log(err);
      process.exit(1);
    });
};
