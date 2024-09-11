const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  price: Number,
  promo_percentage: Number,
  category: String,
});

module.exports = mongoose.model('MenuItem', menuItemSchema);