const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Student = require('../models/Student');
const Event = require('../models/Event');

const router = express.Router();

// Multer disk storage setup for event images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

// Test route to confirm route is connected
router.get('/ping', (req, res) => {
  res.json({ message: 'Admin route is working!' });
});

// Upload students from Excel (.xlsx) file
router.post('/upload-students', multer({ storage: multer.memoryStorage() }).single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    for (const student of data) {
      await Student.updateOne(
        { nic: student.nic, studentId: student.studentId },
        { $set: { name: student.name } },
        { upsert: true }
      );
    }

    res.json({ message: `Uploaded ${data.length} students successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process file' });
  }
});

// Create new event (Admin) with image upload
router.post('/events', upload.single('photo'), async (req, res) => {
  const { name, description, venue, date, time, isFree, price } = req.body;

  if (!name || !venue || !date || !time) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  // photo filename from multer
  const photo = req.file ? req.file.filename : null;

  try {
    const newEvent = new Event({
      name,
      photo,
      description,
      venue,
      date,
      time,
      isFree: isFree === 'true' || isFree === true, // handle string or boolean
      price: isFree === 'true' || isFree === true ? 0 : price,
      attendees: [] // Initialize empty attendees array
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all events with full info and photo URL
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().lean();

    // Add full photo URL
    const host = req.get('host');
    const protocol = req.protocol;
    events.forEach(event => {
      event.photoUrl = event.photo ? `${protocol}://${host}/uploads/${event.photo}` : null;
    });

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student signup for event
// Expects JSON: { studentId, eventId }
router.post('/events/signup', async (req, res) => {
  const { studentId, eventId } = req.body;

  if (!studentId || !eventId) {
    return res.status(400).json({ message: 'Student ID and Event ID are required' });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if student already signed up
    if (event.attendees.some(att => att.toString() === studentId)) {
      return res.status(400).json({ message: 'Student already signed up for this event' });
    }

    // Add student to attendees
    event.attendees.push(studentId);
    await event.save();

    res.json({ message: 'Student signed up for event successfully' });
  } catch (err) {
    console.error('Error signing up student for event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
