const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  name: String,
  latitude: String,
  longitude: String,
  availability: Boolean
});

module.exports = mongoose.model('Stations', StationSchema);