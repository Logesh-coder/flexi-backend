"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const adminAuth = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
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
}, { timestamps: true });
module.exports = mongoose.model("adminAuthRegister", adminAuth);
exports.default = adminAuth;
