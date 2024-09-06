const express = require("express");
const router = express.Router();
const MenuItem = require("../model/Items");

router.post("/add/:id", async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        const quantity = parseInt(req.body.quantity);

        if (item && quantity > 0) {
            req.session.cart = req.session.cart || [];
            req.session.cart.push({
                item: item._id,
                name: item.name,
                price: item.price,
                quantity: quantity
            });

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

module.exports = router;