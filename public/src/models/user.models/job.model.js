"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const createJobForm = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: { type: String, required: true, unique: true },
    description: {
        type: String,
    },
    budget: {
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAuthRegister',
        required: true,
    }
}, { timestamps: true });
module.exports = mongoose.model("Job", createJobForm);
exports.default = createJobForm;
