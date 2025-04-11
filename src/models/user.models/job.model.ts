const mongoose = require("mongoose");

const createJobForm = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  payRate: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  durationStartTime: {
    type: String,
    required: true
  },
  durationEndTime: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  landMark: {
    type: String,
    required: true
  },
  createUserId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Job", createJobForm);
export default createJobForm