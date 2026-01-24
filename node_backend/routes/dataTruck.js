const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const DataTruck = require('../models/DataTruck');
const db = require('../db'); // MySQL connection
const xlsx = require('xlsx');

const uploadDir = path.resolve(__dirname, '..', 'upload', 'doc-data-truck');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const truckNo = req.params.truck_no || 'unknown';
    const timestamp = Date.now();
    cb(null, `truck_${truckNo}_${file.fieldname}_${timestamp}${ext}`);
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

// 1. GET export data trucks to Excel (MOVE TO TOP to prevent :id conflict)
router.get('/export', async (req, res) => {
  try {
    const [mysqlTrucks] = await db.query("SELECT jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck");
    const mongoDataTrucks = await DataTruck.find({});

    const data = mysqlTrucks.map(master => {
      const operational = mongoDataTrucks.find(m => m.truck_no === master.no_police) || {};
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID');
      };

      return {
        'Truck No': master.no_police,
        'Merk': master.merk_mobil,
        'Model': master.model,
        'Type': master.type_truck,
        'No Asset': operational.no_asset || '',
        'No STNK': operational.no_stnk || '',
        'No BPKB': operational.no_bpkb || '',
        'Tahun Pembuatan': operational.tahun_pembuatan || '',
        'Isi Silinder': operational.isi_silinder || '',
        'Nomor Rangka': operational.nomor_rangka || '',
        'Nomor Mesin': operational.nomor_mesin || '',
        'Masa Berlaku STNK': formatDate(operational.masa_berlaku_stnk),
        'Masa Berlaku Pajak STNK': formatDate(operational.masa_berlaku_pajak_stnk),
        'Masa Berlaku KIR': formatDate(operational.masa_berlaku_keur_head_truck),
        'Masa Berlaku Uji Emisi': formatDate(operational.masa_berlaku_uji_emisi),
        'Iuran Aptrindo': formatDate(operational.iuran_aptrindo),
        'Keterangan': operational.keterangan || ''
      };
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    const wscols = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 30 }
    ];
    worksheet['!cols'] = wscols;
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Truck');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Data_Truck.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET all data trucks (merged with Master Truck from MySQL)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const [mysqlTrucks] = await db.query("SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck");
    const mongoDataTrucks = await DataTruck.find({});

    const mergedTrucks = mysqlTrucks.map(master => {
      const operational = mongoDataTrucks.find(m => m.truck_no === master.no_police) || {};
      return {
        _id: operational._id || null,
        truck_no: master.no_police,
        merk: master.merk_mobil,
        model: master.model,
        type: master.type_truck,
        jenis_kendaraan_master: master.jenis_kendaraan,
        no_asset: operational.no_asset || '',
        no_stnk: operational.no_stnk || '',
        no_bpkb: operational.no_bpkb || '',
        tahun_pembuatan: operational.tahun_pembuatan || '',
        isi_silinder: operational.isi_silinder || '',
        nomor_rangka: operational.nomor_rangka || '',
        nomor_mesin: operational.nomor_mesin || '',
        iuran_aptrindo: operational.iuran_aptrindo || null,
        masa_berlaku_stnk: operational.masa_berlaku_stnk || null,
        masa_berlaku_pajak_stnk: operational.masa_berlaku_pajak_stnk || null,
        no_keur_head_truck: operational.no_keur_head_truck || '',
        masa_berlaku_keur_head_truck: operational.masa_berlaku_keur_head_truck || null,
        masa_berlaku_uji_emisi: operational.masa_berlaku_uji_emisi || null,
        keterangan: operational.keterangan || '',
        updatedAt: operational.updatedAt || null
      };
    });

    let finalItems = mergedTrucks;
    if (search) {
      const keyword = search.toLowerCase();
      finalItems = mergedTrucks.filter(t =>
        t.truck_no.toLowerCase().includes(keyword) ||
        t.merk.toLowerCase().includes(keyword) ||
        t.model.toLowerCase().includes(keyword) ||
        t.type.toLowerCase().includes(keyword) ||
        t.no_asset.toLowerCase().includes(keyword)
      );
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

// 3. GET truck suggestions from MySQL
router.get('/search-mysql-trucks', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = "SELECT id_truck, no_police, jenis_kendaraan FROM trucking.truck";
    let params = [];
    if (q) {
      sql += " WHERE no_police LIKE ?";
      params.push(`%${q}%`);
    }
    sql += " ORDER BY no_police ASC LIMIT 20";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. GET single data truck by truck_no (merged with Master info)
router.get('/by-truck-no/:truck_no', async (req, res) => {
  try {
    const { truck_no } = req.params;
    const [mysqlRows] = await db.query(
      "SELECT jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck WHERE no_police = ? LIMIT 1",
      [truck_no]
    );
    if (mysqlRows.length === 0) {
      return res.status(404).json({ message: 'Truck not found in Master' });
    }
    const master = mysqlRows[0];
    let operational = await DataTruck.findOne({ truck_no: truck_no });
    if (!operational) operational = {};

    const merged = {
      _id: operational._id || null,
      truck_no: master.no_police,
      merk: master.merk_mobil,
      model: master.model,
      type: master.type_truck,
      jenis_kendaraan_master: master.jenis_kendaraan,
      no_asset: operational.no_asset || '',
      no_stnk: operational.no_stnk || '',
      no_bpkb: operational.no_bpkb || '',
      tahun_pembuatan: operational.tahun_pembuatan || '',
      isi_silinder: operational.isi_silinder || '',
      nomor_rangka: operational.nomor_rangka || '',
      nomor_mesin: operational.nomor_mesin || '',
      iuran_aptrindo: operational.iuran_aptrindo || null,
      masa_berlaku_stnk: operational.masa_berlaku_stnk || null,
      masa_berlaku_pajak_stnk: operational.masa_berlaku_pajak_stnk || null,
      no_keur_head_truck: operational.no_keur_head_truck || '',
      masa_berlaku_keur_head_truck: operational.masa_berlaku_keur_head_truck || null,
      masa_berlaku_uji_emisi: operational.masa_berlaku_uji_emisi || null,
      keterangan: operational.keterangan || '',
      dok_stnk: operational.dok_stnk || '',
      dok_bpkb: operational.dok_bpkb || '',
      dok_keur: operational.dok_keur || '',
      dok_uji_emisi: operational.dok_uji_emisi || '',
      dok_lain: operational.dok_lain || '',
      dokumen: operational.dokumen || [],
      updatedAt: operational.updatedAt || null
    };
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. GET document list for a truck_no
router.get('/by-truck-no/:truck_no/documents', async (req, res) => {
  try {
    const { truck_no } = req.params;
    const dataTruck = await DataTruck.findOne({ truck_no });
    if (!dataTruck) {
      return res.status(404).json({ message: 'Data Truck tidak ditemukan.' });
    }

    if (Array.isArray(dataTruck.dokumen) && dataTruck.dokumen.length > 0) {
      return res.json({ documents: dataTruck.dokumen });
    }

    const legacyDocs = [];
    if (dataTruck.dok_stnk) {
      legacyDocs.push({
        doc_type: 'dok_stnk',
        filename: dataTruck.dok_stnk,
        original_name: dataTruck.dok_stnk,
        uploaded_at: dataTruck.updatedAt || null,
      });
    }
    if (dataTruck.dok_bpkb) {
      legacyDocs.push({
        doc_type: 'dok_bpkb',
        filename: dataTruck.dok_bpkb,
        original_name: dataTruck.dok_bpkb,
        uploaded_at: dataTruck.updatedAt || null,
      });
    }
    if (dataTruck.dok_keur) {
      legacyDocs.push({
        doc_type: 'dok_keur',
        filename: dataTruck.dok_keur,
        original_name: dataTruck.dok_keur,
        uploaded_at: dataTruck.updatedAt || null,
      });
    }
    if (dataTruck.dok_uji_emisi) {
      legacyDocs.push({
        doc_type: 'dok_uji_emisi',
        filename: dataTruck.dok_uji_emisi,
        original_name: dataTruck.dok_uji_emisi,
        uploaded_at: dataTruck.updatedAt || null,
      });
    }
    if (dataTruck.dok_lain) {
      legacyDocs.push({
        doc_type: 'dok_lain',
        filename: dataTruck.dok_lain,
        original_name: dataTruck.dok_lain,
        uploaded_at: dataTruck.updatedAt || null,
      });
    }

    return res.json({ documents: legacyDocs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. POST create new data truck
router.post('/', async (req, res) => {
  const dataTruck = new DataTruck(req.body);
  try {
    const newDataTruck = await dataTruck.save();
    res.status(201).json(newDataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 6. PUT update data truck by truck_no (Upsert)
router.put('/by-truck-no/:truck_no', async (req, res) => {
  try {
    const { truck_no } = req.params;
    const updateData = req.body;
    delete updateData.truck_no;
    delete updateData.merk;
    delete updateData.model;
    delete updateData.type;
    const updatedDataTruck = await DataTruck.findOneAndUpdate(
      { truck_no: truck_no },
      { ...updateData, truck_no: truck_no },
      { new: true, upsert: true }
    );
    res.json(updatedDataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const allowedDocFields = [
  'dok_stnk',
  'dok_bpkb',
  'dok_keur',
  'dok_uji_emisi',
  'dok_lain'
];

// 7. POST upload document files for data truck
router.post(
  '/by-truck-no/:truck_no/documents',
  (req, res) => {
    upload.any()(req, res, async (err) => {
      if (err) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran Maksimal adalah 2MB'
            : err.message || 'Upload gagal';
        return res.status(400).json({ message });
      }
      try {
        const { truck_no } = req.params;
        const files = Array.isArray(req.files) ? req.files : [];
        const filtered = files.filter((file) => allowedDocFields.includes(file.fieldname));
        if (filtered.length === 0) {
          return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
        }

        const existing = await DataTruck.findOne({ truck_no });
        const existingDocs = Array.isArray(existing?.dokumen)
          ? existing.dokumen
          : [];
        const countByType = existingDocs.reduce((acc, doc) => {
          acc[doc.doc_type] = (acc[doc.doc_type] || 0) + 1;
          return acc;
        }, {});

        const incomingCountByType = filtered.reduce((acc, file) => {
          acc[file.fieldname] = (acc[file.fieldname] || 0) + 1;
          return acc;
        }, {});

        const overLimit = Object.keys(incomingCountByType).find((field) => {
          const current = countByType[field] || 0;
          return current + incomingCountByType[field] > 3;
        });

        if (overLimit) {
          filtered.forEach((file) => {
            const filePath = path.join(uploadDir, file.filename);
            fs.unlink(filePath, () => {});
          });
          return res.status(400).json({ message: 'Maksimal 3 file per kolom.' });
        }

        const newDocs = filtered.map((file) => ({
          doc_type: file.fieldname,
          filename: file.filename,
          original_name: file.originalname,
          uploaded_at: new Date(),
        }));

        const legacyUpdate = {};
        newDocs.forEach((doc) => {
          legacyUpdate[doc.doc_type] = doc.filename;
        });

        const updatedDataTruck = await DataTruck.findOneAndUpdate(
          { truck_no },
          {
            $push: { dokumen: { $each: newDocs } },
            $set: legacyUpdate,
            $setOnInsert: { truck_no },
          },
          { new: true, upsert: true }
        );
        res.json(updatedDataTruck);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
  }
);

// 8. DELETE document file for data truck
router.delete('/by-truck-no/:truck_no/documents/:filename', async (req, res) => {
  try {
    const { truck_no, filename } = req.params;
    const existing = await DataTruck.findOne({ truck_no });
    if (!existing) {
      return res.status(404).json({ message: 'Data Truck tidak ditemukan.' });
    }
    const docs = Array.isArray(existing.dokumen) ? existing.dokumen : [];
    const docItem = docs.find((doc) => doc.filename === filename);
    if (!docItem) {
      return res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    }

    const filePath = path.join(uploadDir, filename);
    fs.unlink(filePath, () => {});

    const updated = await DataTruck.findOneAndUpdate(
      { truck_no },
      { $pull: { dokumen: { filename } } },
      { new: true }
    );

    const remainingDocs = Array.isArray(updated?.dokumen) ? updated.dokumen : [];
    const latestByType = {};
    remainingDocs.forEach((doc) => {
      const prev = latestByType[doc.doc_type];
      if (!prev || new Date(doc.uploaded_at) > new Date(prev.uploaded_at)) {
        latestByType[doc.doc_type] = doc;
      }
    });

    const legacyUpdate = {};
    allowedDocFields.forEach((field) => {
      legacyUpdate[field] = latestByType[field]?.filename || '';
    });

    const finalDoc = await DataTruck.findOneAndUpdate(
      { truck_no },
      { $set: legacyUpdate },
      { new: true }
    );

    res.json(finalDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 9. PUT update data truck by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedDataTruck = await DataTruck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedDataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 10. GET single data truck by id
router.get('/:id', async (req, res) => {
  try {
    const dataTruck = await DataTruck.findById(req.params.id);
    if (!dataTruck) return res.status(404).json({ message: 'Data Truck not found' });
    res.json(dataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 11. DELETE data truck (By ID)
router.delete('/:id', async (req, res) => {
  try {
    await DataTruck.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Data Truck' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
