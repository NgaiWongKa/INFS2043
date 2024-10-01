// Filename - model/User.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var User = new Schema({
    username: {
        type: String
    },
    password: {
        type: String
    },
    balance: {
        type: Number
    },
    type: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    dob: {
        type: Date
    },
    prefFuel: {
        type: String
    },
    paymentMethod: {
        type: String
    },
    cardNumber: {
        type: String
    },
    CVV: {
        type: String
    },
    expirationMonth: {
        type: String
    },
    expirationYear: {
        type: String
    },
    point: {
        type: Number
    },
    grade: {
        type: String
    }
})

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User)