const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  devPort: process.env.API_PORT,
  mongoKey: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefresh: process.env.JWT_SECRET_REFRESH,
};
