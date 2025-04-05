const mongoose = require("mongoose");

const userAuth = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
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
    token: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("userAuthRegister", userAuth);
export default userAuth;