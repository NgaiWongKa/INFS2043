const express = require("express");
const router = express.Router();
const Order = require("../model/Order");

router.get("/", (req, res) => {
    if (req.session.cart && req.session.cart.length > 0) {
        res.render("order/checkout", { cart: req.session.cart });
    } else {
        res.redirect("/menu");
    }
});

router.post("/", async (req, res) => {
    const cart = req.session.cart;

    if (!cart || cart.length === 0) {
        return res.redirect("/menu");
    }

    const totalAmount = cart.reduce((total, cartItem) => total + (cartItem.price - (cartItem.price * cartItem.promo_percentage / 100) * cartItem.quantity), 0);

    const newOrder = new Order({
        user: req.user._id,
        items: cart.map(cartItem => ({
            item: cartItem.id,
            quantity: cartItem.quantity
        })),
        totalAmount: totalAmount
    });

    await newOrder.save();

    req.session.cart = [];

    res.redirect("/order/confirmation/" + newOrder._id);
});

router.get("/confirmation/:orderId", async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate("items.item");

    res.render("order/confirmation", { order });
});

module.exports = router;