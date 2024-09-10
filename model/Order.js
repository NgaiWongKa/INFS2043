const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // Reference to the User model
    },
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem'  // Reference to the MenuItem model
        },
        quantity: Number
    }],
    totalAmount: Number,
    status: {
        type: String,
        default: 'Pending'  // Possible statuses: 'Pending', 'Processing', 'Completed'
    },
    orderedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", OrderSchema);