const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  price: Number,
  category: String,
});

module.exports = mongoose.model('MenuItem', menuItemSchema);