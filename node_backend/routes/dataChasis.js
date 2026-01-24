const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const DataChasis = require('../models/DataChasis');
const xlsx = require('xlsx');

const uploadDir = path.resolve(__dirname, '..', 'upload', 'doc-data-chasis');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const chasisNo = req.params.chasis_no || 'unknown';
    const timestamp = Date.now();
    cb(null, `chasis_${chasisNo}_${file.fieldname}_${timestamp}${ext}`);
  }
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error('Format file tidak didukung'));
      return;
    }
    cb(null, true);
  }
});

// 1. GET export data chasis to Excel (MOVE TO TOP to prevent :id conflict)
router.get('/export', async (req, res) => {
  try {
    const items = await DataChasis.find({}).sort({ updatedAt: -1 });
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID');
    };

    const data = items.map((item) => ({
      'Chasis No': item.chasis_no || '',
      'Maker/Merk': item.maker_merk || '',
      'Type': item.type || '',
      'Year': item.year || '',
      'Asset No': item.asset_no || '',
      'Size': item.size || '',
      'Masa Berlaku Keur Chassis': formatDate(item.masa_berlaku_keur_chassis),
      'Keterangan': item.keterangan || '',
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 30 },
    ];
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Chasis');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Data_Chasis.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET all data chasis
router.get('/', async (req, res) => {
  try {
    const items = await DataChasis.find({}).sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. POST upload document files for data chasis
router.post('/by-chasis-no/:chasis_no/documents', (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran Maksimal adalah 2MB'
          : err.message || 'Upload gagal';
      return res.status(400).json({ message });
    }
    try {
      const { chasis_no } = req.params;
      const files = Array.isArray(req.files) ? req.files : [];
      const filtered = files.filter((file) => file.fieldname === 'dok_keur');
      if (filtered.length === 0) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
      }

      const existing = await DataChasis.findOne({ chasis_no });
      const existingDocs = Array.isArray(existing?.dokumen)
        ? existing.dokumen
        : [];
      const currentCount = existingDocs.filter((doc) => doc.doc_type === 'dok_keur').length;
      if (currentCount + filtered.length > 3) {
        filtered.forEach((file) => {
          const filePath = path.join(uploadDir, file.filename);
          fs.unlink(filePath, () => {});
        });
        return res.status(400).json({ message: 'Maksimal 3 file per kolom.' });
      }

      const newDocs = filtered.map((file) => ({
        doc_type: 'dok_keur',
        filename: file.filename,
        original_name: file.originalname,
        uploaded_at: new Date(),
      }));

      const updatedDataChasis = await DataChasis.findOneAndUpdate(
        { chasis_no },
        {
          $push: { dokumen: { $each: newDocs } },
          $set: { dok_keur: newDocs[newDocs.length - 1]?.filename || '' },
          $setOnInsert: { chasis_no },
        },
        { new: true, upsert: true }
      );
      res.json(updatedDataChasis);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
});

// 4. DELETE document file for data chasis
router.delete('/by-chasis-no/:chasis_no/documents/:filename', async (req, res) => {
  try {
    const { chasis_no, filename } = req.params;
    const existing = await DataChasis.findOne({ chasis_no });
    if (!existing) {
      return res.status(404).json({ message: 'Data Chasis tidak ditemukan.' });
    }
    const docs = Array.isArray(existing.dokumen) ? existing.dokumen : [];
    const docItem = docs.find((doc) => doc.filename === filename);
    if (!docItem) {
      return res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    }

    const filePath = path.join(uploadDir, filename);
    fs.unlink(filePath, () => {});

    const updated = await DataChasis.findOneAndUpdate(
      { chasis_no },
      { $pull: { dokumen: { filename } } },
      { new: true }
    );

    const remainingDocs = Array.isArray(updated?.dokumen) ? updated.dokumen : [];
    const latestDoc = remainingDocs
      .filter((doc) => doc.doc_type === 'dok_keur')
      .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))[0];

    const finalDoc = await DataChasis.findOneAndUpdate(
      { chasis_no },
      { $set: { dok_keur: latestDoc?.filename || '' } },
      { new: true }
    );

    res.json(finalDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. GET single data chasis by id
router.get('/:id', async (req, res) => {
  try {
    const item = await DataChasis.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Data Chasis not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 6. POST create new data chasis (Upsert by chasis_no)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const chasisNo = body.chasis_no;
    if (!chasisNo) {
      return res.status(400).json({ message: 'Chasis No wajib diisi.' });
    }
    const payload = { ...body };
    delete payload.chasis_no;
    const existing = await DataChasis.findOne({ chasis_no: chasisNo });
    if (existing) {
      const updated = await DataChasis.findOneAndUpdate(
        { chasis_no: chasisNo },
        { $set: payload },
        { new: true }
      );
      return res.status(200).json(updated);
    }
    const created = await DataChasis.create({ ...payload, chasis_no: chasisNo });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 7. PUT update data chasis by id
router.put('/:id', async (req, res) => {
  try {
    if (req.body?.chasis_no) {
      delete req.body.chasis_no;
    }
    const updatedDataChasis = await DataChasis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDataChasis) {
      return res.status(404).json({ message: 'Data Chasis not found' });
    }
    res.json(updatedDataChasis);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 8. DELETE data chasis (By ID)
router.delete('/:id', async (req, res) => {
  try {
    const existing = await DataChasis.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Data Chasis not found' });
    }

    const docs = Array.isArray(existing.dokumen) ? existing.dokumen : [];
    docs.forEach((doc) => {
      if (!doc?.filename) return;
      const filePath = path.join(uploadDir, doc.filename);
      fs.unlink(filePath, () => {});
    });

    if (existing.dok_keur) {
      const legacyPath = path.join(uploadDir, existing.dok_keur);
      fs.unlink(legacyPath, () => {});
    }

    await DataChasis.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Data Chasis' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
