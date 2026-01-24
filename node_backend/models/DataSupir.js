const mongoose = require('mongoose');

const lisensiSchema = new mongoose.Schema({
  jenis_lisensi: { type: String, default: '' },
  nomor: { type: String, default: '' },
  masa_berlaku: { type: Date, default: null },
  keterangan: { type: String, default: '' },
  dok_file: { type: String, default: '' },
  dok_original: { type: String, default: '' },
});

const dataSupirSchema = new mongoose.Schema(
  {
    id_driver: { type: Number, index: true },
    no_polisi: { type: String, required: true },
    nik: { type: String, default: '' },
    lisensi: { type: [lisensiSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DataSupir', dataSupirSchema);
