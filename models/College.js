const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  location: String
});

const collegeSchema = new mongoose.Schema({
  collegeName: String,
  collegeCode: String,
  collegeEmail: String,
  password: String,
  addressCity: String,
  addressState: String,
  pincode: String,
  contactPerson: String,
  contactEmail: String,
  collegeType: String,
  hackathons: [hackathonSchema] // ⬅️ Add this
});

module.exports = mongoose.model("College", collegeSchema);