const express = require("express");
const router = express.Router();
const Order = require("../model/Order");
const crypto = require('crypto');

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

module.exports = router;

function hashCVV(cvv) {
    const hash = crypto.createHash('sha256');
    hash.update(cvv);
    return hash.digest('hex');
  }