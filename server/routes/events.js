const express = require('express');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { authenticateToken } = require('./students'); // Adjust path if needed

const router = express.Router();

// Helper to build full photo URL
function getFullPhotoUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// List all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().lean();
    const eventsWithPhotoUrl = events.map(ev => ({
      ...ev,
      photo: getFullPhotoUrl(req, ev.photo),
    }));
    res.json(eventsWithPhotoUrl);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student signup for event (protected with JWT)
router.post('/signup', authenticateToken, async (req, res) => {
  const { eventId } = req.body;
  const studentId = req.student.id; // from JWT payload

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.attendees.includes(student._id)) {
      return res.status(400).json({ message: 'Student already signed up for this event' });
    }

    event.attendees.push(student._id);
    await event.save();

    res.json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event details by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('attendees', 'name nic studentId email').lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    event.photo = getFullPhotoUrl(req, event.photo);
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
