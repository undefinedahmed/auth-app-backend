const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    phone: { type: Number },
    role: { type: String },
  },
  { versionKey: false, timestamps: false }
);

module.exports = mongoose.model("User", UserSchema);
