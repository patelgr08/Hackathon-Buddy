const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  college: {
    type: String,
    required: true,
  },

  branch: {
    type: String,
    required: true,
  },

  year: {
    type: String,
    enum: ["1st", "2nd", "3rd", "4th"],
    required: true,
  },

  techstack: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  state: {
    type: String,
    required: true,
  },

  github: {
    type: String,
    required: true,
  },

  linkedin: {
    type: String,
    required: true,
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },

  profilePic: {
  type: String, // Store image URL or filename
  default: "/images/default-profile.png", // fallback image
},
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
