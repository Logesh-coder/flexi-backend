const mongoose = require("mongoose");

const wishlist = new mongoose.Schema({
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

module.exports = mongoose.model('Wishlist', wishlist)
export default wishlist