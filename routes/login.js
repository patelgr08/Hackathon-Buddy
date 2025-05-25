router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });
    if (student) {
      const passwordMatch = await bcrypt.compare(password, student.password);
      if (!passwordMatch) {
        return res.render("login", { error: "Invalid password." });
      }

      req.session.user = student;
      req.session.role = "student";
      return res.redirect("/register/dashboard");
    }

    const mentor = await Mentor.findOne({ email });
    if (mentor) {
      const passwordMatch = await bcrypt.compare(password, mentor.password);
      if (!passwordMatch) {
        return res.render("login", { error: "Invalid password." });
      }

      req.session.user = mentor;
      req.session.role = "mentor";
      return res.redirect("/register/dashboard");
    }

    res.render("login", { error: "User not found" });
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Server error. Try again later." });
  }
});