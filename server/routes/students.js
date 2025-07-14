const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');

const router = express.Router();

// Ping route for testing connectivity
router.get('/ping', (req, res) => {
  res.json({ message: 'Students route works!' });
});

// Signup route
router.post('/signup', async (req, res) => {
  const { name, nic, studentId, email, password } = req.body;

  if (!name || !nic || !studentId || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const student = await Student.findOne({ nic, studentId });

    if (!student) {
      return res.status(403).json({ message: 'NIC and Student ID not found' });
    }

    if (student.email || student.password) {
      return res.status(400).json({ message: 'Student already signed up' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    student.name = name;
    student.email = email;
    student.password = hashedPassword;
    await student.save();

    res.status(200).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Login successful
    res.status(200).json({ message: 'Login successful', studentId: student._id, name: student.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
