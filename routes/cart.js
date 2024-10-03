const express = require("express");
const router = express.Router();
const MenuItem = require("../model/Items");

router.post("/add/:id", async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        const quantity = parseInt(req.body.quantity);

        if (item && quantity > 0) {
            req.session.cart = req.session.cart || [];

            const cartItem = req.session.cart.find(cartItem => cartItem.item.toString() === item._id.toString());

            if (cartItem) {
                cartItem.quantity += quantity;
            } else {
                req.session.cart.push({
                    item: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: quantity,
                    promo_percentage: item.promo_percentage
                });
            }

            res.json({ message: "Item added to cart", cart: req.session.cart });
        } else {
            res.status(400).json({ message: "Invalid item or quantity" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error adding item to cart" });
    }
});

router.get("/", (req, res) => {
    const cart = req.session.cart || [];

    res.render("cart/index", { cart: cart });
});

router.post("/remove", (req, res) => {
    const { itemId } = req.body;
    const cart = req.session.cart || [];

    if (req.session.cart) {
        const itemIndex = req.session.cart.findIndex(cartItem => cartItem.item.toString() === itemId);
        req.session.cart.splice(itemIndex, 1);
    }
    res.render("cart/index", {cart: cart });
});

module.exports = router;

module.exports = router;