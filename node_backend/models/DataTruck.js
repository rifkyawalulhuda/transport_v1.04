const mongoose = require('mongoose');

const dataTruckSchema = new mongoose.Schema({
  truck_no: { type: String, required: true },
  no_asset: { type: String, default: '' },
  no_stnk: { type: String, default: '' },
  no_bpkb: { type: String, default: '' },
  merk: { type: String, default: '' },
  type: { type: String, default: '' },
  model: { type: String, default: '' },
  tahun_pembuatan: { type: String, default: '' },
  isi_silinder: { type: String, default: '' },
  nomor_rangka: { type: String, default: '' },
  nomor_mesin: { type: String, default: '' },
  iuran_aptrindo: { type: Date, default: null },
  masa_berlaku_stnk: { type: Date, default: null },
  masa_berlaku_pajak_stnk: { type: Date, default: null },
  no_keur_head_truck: { type: String, default: '' },
  masa_berlaku_keur_head_truck: { type: Date, default: null },
  masa_berlaku_uji_emisi: { type: Date, default: null },
  keterangan: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DataTruck', dataTruckSchema);
