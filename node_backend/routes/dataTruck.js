const express = require('express');
const router = express.Router();
const DataTruck = require('../models/DataTruck');
const db = require('../db'); // MySQL connection
const xlsx = require('xlsx');

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
      keterangan: operational.keterangan || ''
    };
    res.json(merged);
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

// 7. PUT update data truck by ID
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

// 8. GET single data truck by id
router.get('/:id', async (req, res) => {
  try {
    const dataTruck = await DataTruck.findById(req.params.id);
    if (!dataTruck) return res.status(404).json({ message: 'Data Truck not found' });
    res.json(dataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 9. DELETE data truck (By ID)
router.delete('/:id', async (req, res) => {
  try {
    await DataTruck.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Data Truck' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
