const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Multer config for Excel files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `batch_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed.'));
  }
});

// All admin routes are protected
router.use(protect);

// GET /api/admin/dashboard - stats
router.get('/dashboard', async (req, res) => {
  try {
    const [total, active, revoked, expired] = await Promise.all([
      Certificate.countDocuments(),
      Certificate.countDocuments({ status: 'active' }),
      Certificate.countDocuments({ status: 'revoked' }),
      Certificate.countDocuments({ status: 'expired' })
    ]);

    const recentCerts = await Certificate.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('certificateId studentName courseName status createdAt');

    const topVerified = await Certificate.find()
      .sort({ verificationCount: -1 })
      .limit(5)
      .select('certificateId studentName verificationCount lastVerifiedAt');

    // Certificates per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Certificate.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: { total, active, revoked, expired },
      recentCerts,
      topVerified,
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/upload - Excel upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!data.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Excel file is empty or has no data rows.' });
    }

    const batchId = `BATCH-${Date.now()}`;
    const results = { success: [], errors: [], skipped: [] };

    const requiredFields = ['studentName', 'studentEmail', 'rollNumber', 'courseName', 'issueDate', 'institution'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      // Normalize keys (case-insensitive, camelCase)
      const normalized = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim().replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/\s/g, '');
        const lowerKey = cleanKey.charAt(0).toLowerCase() + cleanKey.slice(1);
        normalized[lowerKey] = String(row[key]).trim();
      });

      // Map common aliases
      if (normalized['student_name'] || normalized['name']) normalized.studentName = normalized['student_name'] || normalized['name'];
      if (normalized['student_email'] || normalized['email']) normalized.studentEmail = normalized['student_email'] || normalized['email'];
      if (normalized['roll_number'] || normalized['rollno'] || normalized['roll']) normalized.rollNumber = normalized['roll_number'] || normalized['rollno'] || normalized['roll'];
      if (normalized['course_name'] || normalized['course']) normalized.courseName = normalized['course_name'] || normalized['course'];
      if (normalized['issue_date'] || normalized['date']) normalized.issueDate = normalized['issue_date'] || normalized['date'];

      // Validate required fields
      const missing = requiredFields.filter(f => !normalized[f] || normalized[f] === '');
      if (missing.length) {
        results.errors.push({ row: rowNum, error: `Missing fields: ${missing.join(', ')}`, data: normalized });
        continue;
      }

      // Parse date
      let issueDate;
      try {
        if (typeof row['issueDate'] === 'number' || typeof row['Issue Date'] === 'number') {
          const dateSerial = row['issueDate'] || row['Issue Date'];
          issueDate = new Date((dateSerial - 25569) * 86400 * 1000);
        } else {
          issueDate = new Date(normalized.issueDate);
        }
        if (isNaN(issueDate.getTime())) throw new Error('Invalid date');
      } catch {
        results.errors.push({ row: rowNum, error: 'Invalid issue date format', data: normalized });
        continue;
      }

      try {
        const cert = await Certificate.create({
          studentName: normalized.studentName,
          studentEmail: normalized.studentEmail,
          rollNumber: normalized.rollNumber,
          courseName: normalized.courseName,
          courseCode: normalized.courseCode || '',
          grade: normalized.grade || '',
          percentage: normalized.percentage ? parseFloat(normalized.percentage) : undefined,
          issueDate,
          expiryDate: normalized.expiryDate ? new Date(normalized.expiryDate) : undefined,
          institution: normalized.institution,
          department: normalized.department || '',
          certificateType: ['completion','achievement','participation','merit','degree'].includes(normalized.certificateType)
            ? normalized.certificateType : 'completion',
          status: 'active',
          uploadBatch: batchId,
          uploadedBy: req.admin._id
        });
        results.success.push({ row: rowNum, certificateId: cert.certificateId, student: cert.studentName });
      } catch (err) {
        if (err.code === 11000) {
          results.skipped.push({ row: rowNum, reason: 'Duplicate entry', data: normalized });
        } else {
          results.errors.push({ row: rowNum, error: err.message, data: normalized });
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      batchId,
      summary: {
        total: data.length,
        imported: results.success.length,
        errors: results.errors.length,
        skipped: results.skipped.length
      },
      results
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/certificates - list all with filters
router.get('/certificates', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, certificateType, batch } = req.query;
    const query = {};

    if (status) query.status = status;
    if (certificateType) query.certificateType = certificateType;
    if (batch) query.uploadBatch = batch;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [certificates, total] = await Promise.all([
      Certificate.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Certificate.countDocuments(query)
    ]);

    res.json({
      success: true,
      certificates,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/certificates/:id - single cert
router.get('/certificates/:id', async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    res.json({ success: true, certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/certificates - create single
router.post('/certificates', async (req, res) => {
  try {
    const cert = await Certificate.create({ ...req.body, uploadedBy: req.admin._id });
    res.status(201).json({ success: true, certificate: cert });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/certificates/:id - update
router.put('/certificates/:id', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    res.json({ success: true, certificate: cert });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/certificates/:id/revoke
router.patch('/certificates/:id/revoke', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(req.params.id, { status: 'revoked' }, { new: true });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    res.json({ success: true, message: 'Certificate revoked.', certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/certificates/:id/activate
router.patch('/certificates/:id/activate', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    res.json({ success: true, message: 'Certificate activated.', certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/certificates/:id
router.delete('/certificates/:id', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    res.json({ success: true, message: 'Certificate deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/template - download Excel template
router.get('/template', (req, res) => {
  const wb = XLSX.utils.book_new();
  const headers = [
    ['studentName', 'studentEmail', 'rollNumber', 'courseName', 'courseCode', 'grade', 'percentage', 'issueDate', 'expiryDate', 'institution', 'department', 'certificateType']
  ];
  const sample = [
    ['John Doe', 'john@example.com', 'CS2024001', 'Full Stack Development', 'CS501', 'A', '92', '2024-12-15', '', 'ABC University', 'Computer Science', 'completion'],
    ['Jane Smith', 'jane@example.com', 'CS2024002', 'Machine Learning', 'CS601', 'A+', '96', '2024-12-15', '', 'ABC University', 'AI Department', 'achievement']
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
  ws['!cols'] = headers[0].map(() => ({ width: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Certificates');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="certificate_upload_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = router;
