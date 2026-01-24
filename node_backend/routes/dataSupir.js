const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const DataSupir = require('../models/DataSupir');
const db = require('../db');
const xlsx = require('xlsx');

const uploadDir = path.resolve(__dirname, '..', 'upload', 'doc-supir');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const noPolisi = req.params.no_polisi || 'unknown';
    const lisensiId = req.params.lisensi_id || 'unknown';
    const timestamp = Date.now();
    cb(null, `supir_${noPolisi}_${lisensiId}_${timestamp}${ext}`);
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

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID');
};

// 1. GET export data supir to Excel (MOVE TO TOP to prevent :id conflict)
router.get('/export', async (req, res) => {
  try {
    const [mysqlDrivers] = await db.query(
      'SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver'
    );
    const mongoDataSupir = await DataSupir.find({});

    const rows = [];
    mysqlDrivers.forEach((master) => {
      const operational = mongoDataSupir.find(
        (m) => m.no_polisi === master.no_polisi
      ) || {};
      const lisensi = Array.isArray(operational.lisensi)
        ? operational.lisensi
        : [];

      if (lisensi.length === 0) {
        rows.push({
          'No. Police': master.no_polisi,
          NIK: operational.nik || '',
          'Nama Driver': master.nama_driver || '',
          'No. Telp': master.no_telp || '',
          'No. KTP': master.no_ktp || '',
          Alamat: master.alamat || '',
          'Jenis Lisensi/Sertifikat': '',
          Nomor: '',
          'Masa Berlaku': '',
          Keterangan: '',
        });
        return;
      }

      lisensi.forEach((item) => {
        rows.push({
          'No. Police': master.no_polisi,
          NIK: operational.nik || '',
          'Nama Driver': master.nama_driver || '',
          'No. Telp': master.no_telp || '',
          'No. KTP': master.no_ktp || '',
          Alamat: master.alamat || '',
          'Jenis Lisensi/Sertifikat': item.jenis_lisensi || '',
          Nomor: item.nomor || '',
          'Masa Berlaku': formatDate(item.masa_berlaku),
          Keterangan: item.keterangan || '',
        });
      });
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 30 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
    ];
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Supir');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=Data_Supir.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET all data supir (merged with Master Driver from MySQL)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const [mysqlDrivers] = await db.query(
      'SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver'
    );
    const mongoDataSupir = await DataSupir.find({});

    const mergedDrivers = mysqlDrivers.map((master) => {
      const operational = mongoDataSupir.find(
        (m) => m.no_polisi === master.no_polisi
      ) || {};
      return {
        _id: operational._id || null,
        no_polisi: master.no_polisi,
        nik: operational.nik || '',
        nama_driver: master.nama_driver || '',
        no_telp: master.no_telp || '',
        no_ktp: master.no_ktp || '',
        alamat: master.alamat || '',
        lisensi: operational.lisensi || [],
        updatedAt: operational.updatedAt || null,
      };
    });

    let finalItems = mergedDrivers;
    if (search) {
      const keyword = String(search).toLowerCase();
      finalItems = mergedDrivers.filter((item) => {
        const baseMatch =
          String(item.no_polisi || '').toLowerCase().includes(keyword) ||
          String(item.nik || '').toLowerCase().includes(keyword) ||
          String(item.nama_driver || '').toLowerCase().includes(keyword) ||
          String(item.no_telp || '').toLowerCase().includes(keyword) ||
          String(item.no_ktp || '').toLowerCase().includes(keyword) ||
          String(item.alamat || '').toLowerCase().includes(keyword);
        if (baseMatch) return true;
        if (!Array.isArray(item.lisensi)) return false;
        return item.lisensi.some((lis) => {
          return (
            String(lis.jenis_lisensi || '').toLowerCase().includes(keyword) ||
            String(lis.nomor || '').toLowerCase().includes(keyword) ||
            String(lis.keterangan || '').toLowerCase().includes(keyword)
          );
        });
      });
    }

    finalItems.sort((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.json(finalItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. GET driver suggestions from MySQL
router.get('/search-mysql-drivers', async (req, res) => {
  try {
    const { q } = req.query;
    let sql =
      'SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver';
    const params = [];
    if (q) {
      sql += ' WHERE no_polisi LIKE ? OR nama_driver LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY no_polisi ASC LIMIT 20';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. GET single data supir by no_polisi (merged with Master info)
router.get('/by-no-polisi/:no_polisi', async (req, res) => {
  try {
    const { no_polisi } = req.params;
    const [mysqlRows] = await db.query(
      'SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver WHERE no_polisi = ? LIMIT 1',
      [no_polisi]
    );
    if (mysqlRows.length === 0) {
      return res.status(404).json({ message: 'Driver not found in Master' });
    }
    const master = mysqlRows[0];
    let operational = await DataSupir.findOne({ no_polisi });
    if (!operational) operational = {};

    const merged = {
      _id: operational._id || null,
      no_polisi: master.no_polisi,
      nik: operational.nik || '',
      nama_driver: master.nama_driver || '',
      no_telp: master.no_telp || '',
      no_ktp: master.no_ktp || '',
      alamat: master.alamat || '',
      lisensi: operational.lisensi || [],
    };
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. POST create new data supir
router.post('/', async (req, res) => {
  const dataSupir = new DataSupir(req.body);
  try {
    const newDataSupir = await dataSupir.save();
    res.status(201).json(newDataSupir);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 6. PUT update data supir by no_polisi (Upsert)
router.put('/by-no-polisi/:no_polisi', async (req, res) => {
  try {
    const { no_polisi } = req.params;
    const updateData = req.body;
    delete updateData.no_polisi;
    delete updateData.nama_driver;
    delete updateData.no_telp;
    delete updateData.no_ktp;
    delete updateData.alamat;
    const updatedDataSupir = await DataSupir.findOneAndUpdate(
      { no_polisi },
      { ...updateData, no_polisi },
      { new: true, upsert: true }
    );
    res.json(updatedDataSupir);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 7. POST upload lisensi document
router.post('/by-no-polisi/:no_polisi/lisensi/:lisensi_id/document', (req, res) => {
  upload.single('dok_file')(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran Maksimal adalah 2MB'
          : err.message || 'Upload gagal';
      return res.status(400).json({ message });
    }
    try {
      const { no_polisi, lisensi_id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
      }

      const supir = await DataSupir.findOne({ no_polisi });
      if (!supir) {
        return res.status(404).json({ message: 'Data Supir tidak ditemukan.' });
      }
      const lisensi = supir.lisensi.id(lisensi_id);
      if (!lisensi) {
        return res.status(404).json({ message: 'Lisensi tidak ditemukan.' });
      }
      if (lisensi.dok_file) {
        const filePath = path.join(uploadDir, req.file.filename);
        fs.unlink(filePath, () => {});
        return res.status(400).json({ message: 'Dokumen sudah ada untuk lisensi ini.' });
      }

      lisensi.dok_file = req.file.filename;
      lisensi.dok_original = req.file.originalname;
      await supir.save();

      res.json(supir);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
});

// 8. DELETE lisensi document
router.delete('/by-no-polisi/:no_polisi/lisensi/:lisensi_id/document', async (req, res) => {
  try {
    const { no_polisi, lisensi_id } = req.params;
    const supir = await DataSupir.findOne({ no_polisi });
    if (!supir) {
      return res.status(404).json({ message: 'Data Supir tidak ditemukan.' });
    }
    const lisensi = supir.lisensi.id(lisensi_id);
    if (!lisensi) {
      return res.status(404).json({ message: 'Lisensi tidak ditemukan.' });
    }
    if (lisensi.dok_file) {
      const filePath = path.join(uploadDir, lisensi.dok_file);
      fs.unlink(filePath, () => {});
    }
    lisensi.dok_file = '';
    lisensi.dok_original = '';
    await supir.save();
    res.json(supir);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 9. DELETE data supir (By ID)
router.delete('/:id', async (req, res) => {
  try {
    await DataSupir.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Data Supir' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
