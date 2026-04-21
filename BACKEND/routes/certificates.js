const express = require('express');
const Certificate = require('../models/Certificate');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');

const router = express.Router();

// PUBLIC: Verify certificate by ID
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId: certificateId.toUpperCase() });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Certificate not found. Please check the certificate ID.'
      });
    }

    // Update verification stats
    certificate.verificationCount += 1;
    certificate.lastVerifiedAt = new Date();
    await certificate.save();

    // Verify hash integrity
    const hashData = `${certificate.certificateId}${certificate.studentName}${certificate.rollNumber}${certificate.courseName}${certificate.issueDate}`;
    const expectedHash = crypto.createHash('sha256').update(hashData).digest('hex');
    const isIntact = expectedHash === certificate.secureHash;

    const isExpired = certificate.expiryDate && new Date() > certificate.expiryDate;

    res.json({
      success: true,
      verified: certificate.status === 'active' && isIntact,
      status: isExpired ? 'expired' : certificate.status,
      integrityCheck: isIntact,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        studentEmail: certificate.studentEmail,
        rollNumber: certificate.rollNumber,
        courseName: certificate.courseName,
        courseCode: certificate.courseCode,
        grade: certificate.grade,
        percentage: certificate.percentage,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        institution: certificate.institution,
        department: certificate.department,
        certificateType: certificate.certificateType,
        status: certificate.status,
        verificationCount: certificate.verificationCount,
        lastVerifiedAt: certificate.lastVerifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUBLIC: Verify by roll number
router.get('/verify-by-roll/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const certificates = await Certificate.find({
      rollNumber: { $regex: new RegExp(`^${rollNumber}$`, 'i') }
    });

    if (!certificates.length) {
      return res.status(404).json({
        success: false,
        message: 'No certificates found for this roll number.'
      });
    }

    res.json({
      success: true,
      count: certificates.length,
      certificates: certificates.map(c => ({
        certificateId: c.certificateId,
        studentName: c.studentName,
        courseName: c.courseName,
        issueDate: c.issueDate,
        status: c.status,
        institution: c.institution
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUBLIC: Download certificate PDF
router.get('/download/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId: certificateId.toUpperCase() });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (certificate.status !== 'active') {
      return res.status(403).json({ success: false, message: `Certificate is ${certificate.status}. Cannot download.` });
    }

    // Generate QR code
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateId}.pdf"`);
    doc.pipe(res);

    const W = 841.89, H = 595.28;

    // Background gradient
    doc.rect(0, 0, W, H).fill('#0a0a1a');

    // Decorative border
    doc.rect(20, 20, W - 40, H - 40).lineWidth(2).stroke('#c9a84c');
    doc.rect(25, 25, W - 50, H - 50).lineWidth(0.5).stroke('#c9a84c');

    // Corner ornaments
    const corners = [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]];
    corners.forEach(([x, y]) => {
      doc.circle(x, y, 5).fill('#c9a84c');
    });

    // Header band
    doc.rect(20, 20, W - 40, 80).fill('#1a1a3e');

    // Institution name
    doc.fontSize(22).fillColor('#c9a84c')
      .font('Helvetica-Bold')
      .text(certificate.institution, 60, 40, { width: W - 200, align: 'center' });

    // Certificate type subtitle
    const typeMap = {
      completion: 'Certificate of Completion',
      achievement: 'Certificate of Achievement',
      participation: 'Certificate of Participation',
      merit: 'Certificate of Merit',
      degree: 'Degree Certificate'
    };
    doc.fontSize(11).fillColor('#a0a0c0')
      .font('Helvetica')
      .text(typeMap[certificate.certificateType] || 'Certificate', 60, 68, { width: W - 200, align: 'center' });

    // "This is to certify that"
    doc.fontSize(13).fillColor('#8080a0')
      .font('Helvetica')
      .text('This is to certify that', 60, 125, { width: W - 200, align: 'center' });

    // Student name - prominent
    doc.fontSize(34).fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(certificate.studentName, 60, 148, { width: W - 200, align: 'center' });

    // Decorative line under name
    const nameY = 195;
    doc.moveTo(200, nameY).lineTo(W - 200, nameY).lineWidth(1).stroke('#c9a84c');

    // Roll number
    doc.fontSize(11).fillColor('#c9a84c')
      .font('Helvetica')
      .text(`Roll No: ${certificate.rollNumber}`, 60, 205, { width: W - 200, align: 'center' });

    // "has successfully completed"
    doc.fontSize(13).fillColor('#8080a0')
      .text('has successfully completed the course', 60, 230, { width: W - 200, align: 'center' });

    // Course name
    doc.fontSize(20).fillColor('#e0c060')
      .font('Helvetica-Bold')
      .text(certificate.courseName, 60, 252, { width: W - 200, align: 'center' });

    if (certificate.courseCode) {
      doc.fontSize(10).fillColor('#808090').font('Helvetica')
        .text(`Course Code: ${certificate.courseCode}`, 60, 280, { width: W - 200, align: 'center' });
    }

    // Details row
    const detailY = 310;
    const details = [];
    if (certificate.department) details.push({ label: 'Department', value: certificate.department });
    if (certificate.grade) details.push({ label: 'Grade', value: certificate.grade });
    if (certificate.percentage) details.push({ label: 'Score', value: `${certificate.percentage}%` });

    const issueFormatted = new Date(certificate.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    details.push({ label: 'Issue Date', value: issueFormatted });

    const colW = (W - 200) / Math.max(details.length, 1);
    details.forEach((d, i) => {
      const x = 100 + i * colW;
      doc.fontSize(9).fillColor('#808090').font('Helvetica').text(d.label, x, detailY, { width: colW, align: 'center' });
      doc.fontSize(13).fillColor('#ffffff').font('Helvetica-Bold').text(d.value, x, detailY + 16, { width: colW, align: 'center' });
    });

    // Certificate ID section
    doc.rect(60, H - 110, 200, 55).fill('#111130');
    doc.fontSize(8).fillColor('#8080a0').font('Helvetica').text('CERTIFICATE ID', 70, H - 102);
    doc.fontSize(11).fillColor('#c9a84c').font('Helvetica-Bold').text(certificate.certificateId, 70, H - 88);
    doc.fontSize(7).fillColor('#606080').font('Helvetica').text('Use this ID to verify at our portal', 70, H - 70);

    // QR Code
    doc.image(qrBuffer, W - 160, H - 120, { width: 90, height: 90 });
    doc.fontSize(7).fillColor('#606080').text('Scan to Verify', W - 155, H - 28, { width: 80, align: 'center' });

    // Secure hash footer
    doc.fontSize(6).fillColor('#404050')
      .text(`Secure Hash: ${certificate.secureHash.substring(0, 40)}...`, 60, H - 38, { width: W - 120 });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Error generating certificate PDF.' });
    }
  }
});

module.exports = router;
