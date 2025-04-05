const mongoose = require("mongoose");

const applyJobForm = new mongoose.Schema({
    applyJob_id : {
        type: String,
        require: true,
    },
    payYourAmount: {
        type: String,
        require: true,
    },
    userId: {
        type: String,
        require: true,
    },
})

module.exports = mongoose.model("Apply Job Users", applyJobForm)
export default applyJobForm