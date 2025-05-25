const express = require('express');
const router = express.Router();
const College = require('../models/College'); // update path as per your project
// const nodemailer = require('nodemailer'); // if OTP is implemented

router.post('/college', async (req, res) => {
  try {
    const {
      collegeName,
      collegeCode,
      collegeEmail,
      password,
      confirmPassword,
      addressCity,
      addressState,
      pincode,
      contactPerson,
      contactEmail,
      collegeType
    } = req.body;

    // ✅ Basic validation
    if (
      !collegeName || !collegeCode || !collegeEmail || !password ||
      !confirmPassword || !addressCity || !addressState || !pincode ||
      !contactPerson || !contactEmail || !collegeType
    ) {
      return res.send("All fields are required.");
    }

    // ✅ Password match check
    if (password !== confirmPassword) {
      return res.send("Passwords do not match.");
    }

    // ✅ Save to DB
    const newCollege = new College({
      collegeName,
      collegeCode,
      collegeEmail,
      password, // (Consider hashing in production)
      address: { city: addressCity, state: addressState, pincode },
      contactPerson,
      contactEmail,
      collegeType,
      hackathons: []
    });

    await newCollege.save();

    // ✅ Render dashboard with this college
    res.render('collegeDashboard', { college: newCollege });

  } catch (err) {
    console.error(err);
    res.send("Error registering college.");
  }
});

module.exports = router;