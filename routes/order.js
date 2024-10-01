const express = require("express");
const router = express.Router();
const Order = require("../model/Order");
const isAuthenticated = require('../middleware/auth');
const crypto = require('crypto');


module.exports = (userSockets) => {
router.get("/", (req, res) => {
    if (req.session.cart && req.session.cart.length > 0) {
        res.render("order/checkout", { cart: req.session.cart });
    } else {
        res.redirect("/menu");
    }
});

router.post("/", async (req, res) => {

    try {
        const paymentMethod = req.body.paymentMethod;
        const cvv = req.body.cvv;
        const user = req.user;

        if (paymentMethod === 'card') {
            if (!user.cardNumber || !user.CVV) {
                return res.status(400).json({ message: "No saved card information found." });
            }

            const hashedCVV = hashCVV(cvv);
            if (hashedCVV !== user.CVV) {
                return res.status(400).json({ message: "Invalid CVV." });
            }
        }

    const cart = req.session.cart;

    if (!cart || cart.length === 0) {
        return res.redirect("/menu");
    }

    const totalAmount = cart.reduce((total, cartItem) => total + ((cartItem.price - (cartItem.price * cartItem.promo_percentage / 100)) * cartItem.quantity), 0);

    const newOrder = new Order({
        user: req.user._id,
        items: cart.map(cartItem => ({
            item: cartItem.id,
            itemName: cartItem.name,
            quantity: cartItem.quantity
        })),
        totalAmount: totalAmount
    });

    await newOrder.save();

    req.session.cart = [];

    res.redirect("/order/confirmation/" + newOrder._id);
    }   catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing order" });
    }
});

router.get("/confirmation/:orderId", async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate("items.item");

    res.render("order/confirmation", { order });
});

router.get("/staff", isAuthenticated, async (req, res) => {
    try {
        const pendingOrders = await Order.find({ status: 'Pending' })
            .populate('user') // Populate user information
            .populate('items.item'); // Populate item information

        res.render("staff/staffOrders", { orders: pendingOrders }); // Render the staffOrders view with the orders
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching orders" });
    }
});



router.post('/ready/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user');
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Update the order status to 'Ready'
        order.status = 'Ready';
        await order.save();

        // Log the user ID and current userSockets
        console.log('Order user ID:', order.user._id); 
        console.log('Connected user sockets:', userSockets); 

        // Check if the customer is connected
        const customerSocketId = userSockets[order.user._id.toString()]; // Ensure user ID is a string
        if (customerSocketId) {
                req.io.to(customerSocketId).emit('orderReady', order);
        } else {
            console.log(`User with ID ${order.user._id} is not connected.`);
        }
        res.redirect("/order/staff");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/pending", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    try {
        const pendingOrders = await Order.find({ user: req.user._id, status: 'Pending' });
        res.render('order/pending', { orders: pendingOrders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

function hashCVV(cvv) {
    const hash = crypto.createHash('sha256');
    hash.update(cvv);
    return hash.digest('hex');
  }
    return router;
}

//module.exports = router;