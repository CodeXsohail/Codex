const mongoose = require("mongoose");
const usersSchema = mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    uname: {
        type: String,
        required: true
    },
    roll: {
        type: String,
        required: true
    }
});

const User = mongoose.model("User",usersSchema);
module.exports = User;