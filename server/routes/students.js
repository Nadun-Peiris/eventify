const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const router = express.Router();

// Secret for JWT (make sure to set in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, student) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.student = student; // attach decoded info to request
    next();
  });
}

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

    // Create JWT payload
    const payload = {
      id: student._id,
      name: student.name,
      email: student.email,
    };

    // Sign JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Login successful — return token and student info
    res.status(200).json({ message: 'Login successful', token, studentId: student._id, name: student.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
