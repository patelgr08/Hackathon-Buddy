const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');

const Student = require('./models/student');
const Mentor = require('./models/mentor');
const College = require('./models/College');

const app = express();

// ===== MONGODB CONNECTION =====
mongoose.connect('mongodb://localhost:27017/hackathonBuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ===== MIDDLEWARE =====
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use("/uploads", express.static("uploads"));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// ===== NODEMAILER SETUP =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password'
  }
});

// ===== LOGIN ROUTES =====
app.get('', (req, res) => {
  res.render('login', { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await Student.findOne({ email }) || await Mentor.findOne({ email });
    let role = user instanceof Student ? "Student" : "Mentor";

    if (!user || user.password !== password) {
      return res.render("login", { error: "Invalid credentials" });
    }

    req.session.user = user.email;
    req.session.role = role;

    res.render("dashboard", { user });
  } catch (err) {
    console.error(err);
    return res.render("login", { error: "Internal server error" });
  }
});

// ===== COLLEGE OTP + REGISTRATION =====
app.post('/send-college-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: 'Email required' });

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await transporter.sendMail({
      from: '"Hackathon Buddy" <your_email@gmail.com>',
      to: email,
      subject: 'Your College Registration OTP',
      text: `Your OTP for college registration is: ${otp}`
    });

    let college = await College.findOne({ collegeEmail: email });
    if (!college) college = new College({ collegeEmail: email });

    college.otp = otp;
    college.otpExpires = otpExpires;
    await college.save();

    res.json({ success: true });
  } catch (error) {
    console.error('OTP send error:', error);
    res.json({ success: false });
  }
});

app.post('/register/college', async (req, res) => {
  const {
    collegeName, collegeCode, collegeEmail, password, confirmPassword,
    otp, addressCity, addressState, pincode, contactPerson,
    contactEmail, collegeType
  } = req.body;

  if (!collegeName || !collegeCode || !collegeEmail || !password || !confirmPassword || !otp || !addressCity || !addressState || !pincode || !contactPerson || !contactEmail || !collegeType) {
    return res.status(400).send('All fields are required.');
  }

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match.');
  }

  const college = await College.findOne({ collegeEmail });
  if (!college || college.otp !== otp || college.otpExpires < new Date()) {
    return res.status(400).send('Invalid or expired OTP.');
  }

  Object.assign(college, {
    collegeName, collegeCode, password, addressCity, addressState,
    pincode, contactPerson, contactEmail, collegeType,
    otp: undefined, otpExpires: undefined
  });

  await college.save();
  res.send('College registered successfully!');
});

// ===== STUDENT & MENTOR REGISTRATION =====
app.get('/register/college', (req, res) => res.render('college-registration', { error: null }));
app.get('/register/student', (req, res) => res.render('student-registration', { error: null }));
app.get('/register/mentor', (req, res) => res.render('mentor-registration', { error: null }));
app.get('/signup', (req, res) => res.render('signup', { error: null }));

app.post('/register/student', async (req, res) => {
  const { name, email, password, ...rest } = req.body;
  const student = new Student({ name, email, password, ...rest });
  await student.save();
  req.session.user = student.email;
  res.render("dashboard", { user: student });
});

// ===== DASHBOARD & PROFILE =====
app.get('/register/dashboard', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');

  const currentUser = await Student.findById(userId) || await Mentor.findById(userId);
  if (!currentUser) return res.redirect('/login');

  const suggestions = await Student.find({ _id: { $ne: userId } });
  res.render('dashboard', { user: currentUser, suggestions });
});

app.get('/profile', async (req, res) => {
  const email = req.session.user;
  if (!email) return res.redirect('/');

  const user = await Student.findOne({ email }) || await Mentor.findOne({ email });
  if (!user) return res.status(404).send("User not found");

  res.render("dashboard", { userEmail: user.email });
});

app.get('/register/profile', async (req, res) => {
  const sessionUser = req.session.user;
  const user = await Student.findOne({ email: sessionUser }) || await Mentor.findOne({ email: sessionUser });
  if (!user) return res.status(404).send("User not found");
  res.render("profile", { user });
});

// ===== EXPLORE & SEARCH =====
app.get('/explore', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const allStudents = await Student.find({ email: { $ne: req.session.user } });
  const allMentors = await Mentor.find({ email: { $ne: req.session.user } });
  res.render('explore', { students: allStudents, mentors: allMentors });
});

app.get('/register/search', async (req, res) => {
  const query = req.query.query;
  const students = await Student.find({
    $or: [
      { fullName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { techStack: { $regex: query, $options: "i" } }
    ]
  });
  const mentors = await Mentor.find({
    $or: [
      { fullName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { techStack: { $regex: query, $options: "i" } }
    ]
  });
  res.render("searchResults", { students, mentors, query });
});

// ===== PROFILE VIEW =====
app.get("/register/view-profile/:id", async (req, res) => {
  const user = await Student.findById(req.params.id) || await Mentor.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  const role = user instanceof Student ? "Student" : "Mentor";
  res.render("profile", { user, role });
});

app.get("/profile/:id", async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (student) return res.render("publicProfile", { user: student, type: "Student" });
  const mentor = await Mentor.findById(req.params.id);
  if (mentor) return res.render("publicProfile", { user: mentor, type: "Mentor" });
  res.status(404).send("User not found");
});

// ===== COLLEGE DASHBOARD =====
app.get("/college/dashboard", async (req, res) => {
  const college = await College.findById(req.session.user._id);
  res.render("collegeDashboard", { college });
});

// ===== CHAT (SOCKET.IO) =====
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("chat message", (msg) => io.emit("chat message", msg));
  socket.on("disconnect", () => console.log("User disconnected"));
});

app.get("/register/chat", (req, res) => res.render("chat"));

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// ===== FILE UPLOAD SETUP =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== SERVER START =====
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.use(express.json()); // Needed to parse JSON bodies

app.post("/register/connect", async (req, res) => {
  const { targetId } = req.body;

  // TODO: Implement connection logic here (e.g., save to DB, send notification, etc.)

  console.log(`Connect requested to user ID: ${targetId}`);
  res.json({ success: true }); // Return JSON response
});

app.post('/register/connect', async (req, res) => {
  const { targetId } = req.body;
  const currentUserId = req.session.userId;

  try {
    await Connection.create({
      from: currentUserId,
      to: targetId
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

app.get('/messages/start', async (req, res) => {
  const currentUserId = req.session.userId;
  const targetId = req.query.targetId;

  // Check if chat exists or create new one
  let chat = await Chat.findOne({
    participants: { $all: [currentUserId, targetId] }
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [currentUserId, targetId],
      messages: []
    });
  }

  res.redirect(`/register/chat/${chat._id}`);
});

app.get('register/mentor', (req, res) => {
  res.render('mentor-registration', { error: null });
}
);

app.post('/register/mentor', async (req, res) => {
  try {
    const {
      fullName, email, password, confirmPassword, experience, expertise,
      linkedin, github, portfolio, city, state, otp, emailVerified
    } = req.body;

    if (password !== confirmPassword) {
      return res.send('Passwords do not match.');
    }

    const newMentor = new Mentor({
      fullName,
      email,
      password,
      experience,
      expertise,
      linkedin,
      github,
      portfolio,
      city,
      state,
    });

    await newMentor.save();

    // ✅ Pass email to the GET route
    res.redirect(`/register/mentor-dashboard?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error(error);
    res.send('Error registering mentor.');
  }
});

app.get('/register/mentor-dashboard', async (req, res) => {
  try {
    const mentorEmail = req.query.email;

    if (!mentorEmail) {
      return res.send("Mentor email not provided.");
    }

    const mentor = await Mentor.findOne({ email: mentorEmail });

    if (!mentor) {
      return res.send("Mentor not found.");
    }

    res.render('mentor-dashboard', { mentor });
  } catch (err) {
    console.error(err);
    res.send("Error loading dashboard.");
  }
});



app.get('/explore/students', async (req, res) => {
  try {
    const { techStack, city, state, experience } = req.query;

    const filter = {};

    if (techStack) filter.techStack = { $regex: techStack, $options: 'i' };
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };
    if (experience) filter.experience = { $gte: parseInt(experience) };

    const students = await Student.find(filter);
    res.render('explore-students', { students, filters: req.query });
  } catch (err) {
    console.error(err);
    res.send('Error loading student profiles.');
  }
});

app.post('/connect/:studentId', (req, res) => {
  const studentId = req.params.studentId;

  // You can log or store the connection intent here
  console.log(`Mentor wants to connect with student ID: ${studentId}`);

  // Redirect back to explore or show a confirmation
  res.send(`Connection request sent to student with ID: ${studentId}`);
});

app.use(session({ secret: 'yourSecret', resave: false, saveUninitialized: true }));

app.get('/register/edit', (req, res) => {
  
  const userEmail = req.session.user;
  Student.findOne({ email: userEmail }, (err, student) => {
    if (err || !student) {
      return res.status(404).send('User not found');
    }
    res.render('edit', { student });
  });
}
);
const registerRoutes = require('./routes/collegeRegister');
app.use('/collegeRegister', registerRoutes);


app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));

app.use('/collegeRegister', registerRoutes);