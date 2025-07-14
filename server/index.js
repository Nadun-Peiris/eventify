const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/events');

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploads folder statically for image access via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route to verify server running
app.post('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Mount your routers on their respective paths
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 5001;

// Basic root route
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
