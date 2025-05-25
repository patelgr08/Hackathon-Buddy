const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  experience: Number,
  expertise: String,
  linkedin: String,
  github: String,
  portfolio: String,
  city: String,
  state: String
});

module.exports = mongoose.model('Mentor', mentorSchema);