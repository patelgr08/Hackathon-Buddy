// Dashboard Route
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const student = await Student.findOne({ email: req.session.user });
  if (student) {
    return res.render('dashboard', { user: student });
  }

  res.send('User not found.');
});

module.exports = router;