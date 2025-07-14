const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String }, // URL or path to image
  description: { type: String },
  venue: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

module.exports = mongoose.model('Event', EventSchema);
