const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentEmail: {
    type: String,
    required: [true, 'Student email is required'],
    lowercase: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  courseCode: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    trim: true
  },
  percentage: {
    type: Number
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  expiryDate: {
    type: Date
  },
  institution: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  certificateType: {
    type: String,
    enum: ['completion', 'achievement', 'participation', 'merit', 'degree'],
    default: 'completion'
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerifiedAt: {
    type: Date
  },
  uploadBatch: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  qrCode: {
    type: String
  },
  secureHash: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate certificate ID and secure hash before saving
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.certificateId = `CERT-${timestamp}-${random}`;
  }

  // Generate secure hash for tamper detection
  const hashData = `${this.certificateId}${this.studentName}${this.rollNumber}${this.courseName}${this.issueDate}`;
  this.secureHash = crypto.createHash('sha256').update(hashData).digest('hex');

  this.updatedAt = Date.now();
  next();
});

certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ rollNumber: 1 });
certificateSchema.index({ studentEmail: 1 });
certificateSchema.index({ status: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
