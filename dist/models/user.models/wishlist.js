"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlist = exports.userWishlist = void 0;
const mongoose = require("mongoose");
const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'userAuthRegister'
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Job'
    },
}, { timestamps: true });
const userWishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'userAuthRegister'
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Worker'
    },
}, { timestamps: true });
const wishlist = mongoose.model('Wishlist', wishlistSchema);
exports.wishlist = wishlist;
const userWishlist = mongoose.model('UserWishlist', userWishlistSchema);
exports.userWishlist = userWishlist;
//# sourceMappingURL=wishlist.js.map