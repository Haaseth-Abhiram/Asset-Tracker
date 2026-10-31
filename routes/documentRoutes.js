const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getAsync, allAsync, runAsync } = require('../database/database');
const { upload, uploadDir } = require('../middleware/uploadMiddleware');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// POST /api/documents/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided.' });
    }

    const { entityType = 'general', entityId = '' } = req.body;

    const result = await runAsync(
      `INSERT INTO documents 
        (original_name, file_name, file_path, mime_type, file_size, uploaded_by, entity_type, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.file.originalname,
        req.file.filename,
        req.file.path,
        req.file.mimetype,
        req.file.size,
        req.user?.email || 'admin',
        entityType,
        entityId
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: result.lastID,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/api/documents/file/${req.file.filename}`
      },
      message: 'File uploaded successfully.'
    });
  } catch (err) {
    console.error('Document upload error:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload document.' });
  }
});

// GET /api/documents/:id (Download document metadata & stream)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getAsync('SELECT * FROM documents WHERE id = ?', [id]);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ success: false, error: 'File not found on server storage.' });
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
    return res.sendFile(doc.file_path);
  } catch (err) {
    console.error('Download document error:', err);
    return res.status(500).json({ success: false, error: 'Failed to download document.' });
  }
});

// GET /api/documents/file/:filename (Direct authenticated or image stream)
router.get('/file/:filename', optionalAuth, (req, res) => {
  try {
    const { filename } = req.params;
    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    let filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      const repoUploadPath = path.resolve(process.cwd(), 'uploads', safeFilename);
      if (fs.existsSync(repoUploadPath)) {
        filePath = repoUploadPath;
      } else {
        return res.status(404).json({ success: false, error: 'File not found.' });
      }
    }

    return res.sendFile(filePath);
  } catch (err) {
    console.error('Serve file error:', err);
    return res.status(500).json({ success: false, error: 'Failed to serve file.' });
  }
});

module.exports = router;
