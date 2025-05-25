const express = require("express");
const bcrypt = require("bcrypt");
const College = require("../models/College");
const router = express.Router();

router.post("/register/college", async (req, res) => {
  const {
    collegeName, collegeCode, collegeEmail, password,
    addressCity, addressState, pincode, contactPerson,
    contactEmail, collegeType
  } = req.body;

  try {
    const existing = await College.findOne({ collegeEmail });
    if (existing) {
      return res.status(400).send("College already registered with this email.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCollege = new College({
      collegeName,
      collegeCode,
      collegeEmail,
      password: hashedPassword,
      addressCity,
      addressState,
      pincode,
      contactPerson,
      contactEmail,
      collegeType
    });

    await newCollege.save();

    req.session.user = newCollege;
    req.session.role = "college";
    res.redirect("/college/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error while registering college.");
  }
});
router.get("/college/dashboard", (req, res) => {
  if (!req.session.user || req.session.role !== "college") {
    return res.redirect("/login");
  }
  res.render("collegeDashboard", { college: req.session.user });
});

module.exports = router;