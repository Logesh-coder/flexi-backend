const mongoose = require("mongoose");

const userAuth = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    profileUrl: {
      type: String,
    },
    mobile: {
      type: Number,
      required: [true, "Please enter your number"],
    },
    date_of_birth: {
      type: String,
      required: [true, "Please enter your Date of Birth"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    salary: {
      type: Number,
      default: 250
    },
    isActive: {
      type: Boolean,
      default: false
    },
    instaProfileLink: { type: String, },
    token: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("userAuthRegister", userAuth);
export default userAuth;