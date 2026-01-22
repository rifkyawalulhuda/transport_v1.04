const express = require('express');
const router = express.Router();
const DataTruck = require('../models/DataTruck');
const db = require('../db'); // MySQL connection

// GET all data trucks
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { truck_no: { $regex: search, $options: 'i' } },
          { no_asset: { $regex: search, $options: 'i' } },
          { merk: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const dataTrucks = await DataTruck.find(query).sort({ updatedAt: -1 });
    res.json(dataTrucks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET truck suggestions from MySQL
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

// POST create new data truck
router.post('/', async (req, res) => {
  const dataTruck = new DataTruck(req.body);
  try {
    const newDataTruck = await dataTruck.save();
    res.status(201).json(newDataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET single data truck by id
router.get('/:id', async (req, res) => {
  try {
    const dataTruck = await DataTruck.findById(req.params.id);
    if (!dataTruck) {
      return res.status(404).json({ message: 'Data Truck not found' });
    }
    res.json(dataTruck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update data truck
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

// DELETE data truck
router.delete('/:id', async (req, res) => {
  try {
    await DataTruck.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Data Truck' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
