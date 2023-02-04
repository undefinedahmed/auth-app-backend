const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OTPSchema = new Schema(
  {
    email: { type: String, unique: true },
    code: { type: Number },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("OTP", OTPSchema);
