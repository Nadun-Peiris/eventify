const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Student = require('../models/Student');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Test route to confirm route is connected
router.get('/ping', (req, res) => {
  res.json({ message: 'Admin route is working!' });
});

// ✅ Upload students from Excel (.xlsx) file
router.post('/upload-students', upload.single('file'), async (req, res) => {
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

module.exports = router;
