const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OTPSchema = new Schema(
  {
    email: { type: String, unique: true },
    code: { type: Number },
    expiresAt: { type: Number },
  },
  { versionKey: false, timestamps: false }
);

module.exports = mongoose.model("OTP", OTPSchema);
