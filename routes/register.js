const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const Student = require('../models/student');
const Mentor = require('../models/mentor');
const College = require('../models/College');

// Student Registration
router.post('/student', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.send("Student registered successfully!");
  } catch (err) {
    res.status(500).send("Error registering student.");
  }
});

// Mentor Registration
router.post('/mentor', async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.send("Mentor registered successfully!");
  } catch (err) {
    res.status(500).send("Error registering mentor.");
  }
});

// College Registration
router.post('/college', async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();
    res.send("College registered successfully!");
  } catch (err) {
    res.status(500).send("Error registering college.");
  }
});

const otpStore = {}; // Temporarily stores OTPs

// Send OTP to email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Hackathon Buddy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.json({ success: false });
  }
});
// After college.save()
await college.save();

// Log the user in by saving email to session
req.session.user = college.collegeEmail;

// Redirect to dashboard
res.redirect('/dashboard');

app.post("/register", upload.single("profilePic"), async (req, res) => {
  const { fullName, email, password, collegeName, graduationYear } = req.body;

  const profilePicPath = req.file ? req.file.filename : null;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newStudent = new Student({
    fullName,
    email,
    password: hashedPassword,
    collegeName,
    graduationYear,
    profilePic: profilePicPath, // Save filename
  });

  await newStudent.save();
  res.redirect("/login");
});

router.get('/edit', ensureLoggedIn, async (req, res) => {
  const user = await Student.findById(req.session.userId);
  res.render('edit', { user });
});

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// POST route to update profile
router.post('/edit', upload.single('profilePicture'), async (req, res) => {
  try {
    const { fullName, email, college, year, techstack, linkedin } = req.body;
    const updateData = { fullName, email, college, year, techstack, linkedin };

    if (req.file) {
      updateData.profilePicture = req.file.filename; // save filename in DB
    }

    // Update user in database
    await Student.findByIdAndUpdate(req.session.userId, updateData);

    res.redirect('/register/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});

app.use('/register', require('./routes/register'));
// Export this route

module.exports = router;