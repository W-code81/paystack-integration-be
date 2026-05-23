const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: [true, 'Full name is required'] },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        lowercase: true, // Automatically converts to lowercase
        trim: true,      // Removes whitespace
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        validate: {
            validator: function (value) {
                return validator.isEmail(value);
            },
            message: 'Please fill a valid email address'
        }
    },
    paystack_ref: {
        type: String,
    },
    amountDonated: {
        type: Number,
    },
    isSubscribed: {
        type: Boolean,
    },
    planName: {
        type: String,
    },
    timeSubscribed: {
        type: Date,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters long'] }
    },
    {
        timestamps: true,
    });

const User = mongoose.model('User', userSchema);

module.exports = User