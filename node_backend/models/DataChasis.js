const mongoose = require('mongoose');

const dataChasisSchema = new mongoose.Schema(
  {
    chasis_no: { type: String, required: true },
    maker_merk: { type: String, default: '' },
    type: { type: String, default: '' },
    year: { type: String, default: '' },
    asset_no: { type: String, default: '' },
    size: { type: String, default: '' },
    masa_berlaku_keur_chassis: { type: Date, default: null },
    keterangan: { type: String, default: '' },
    dok_keur: { type: String, default: '' },
    dokumen: {
      type: [
        {
          doc_type: { type: String, default: '' },
          filename: { type: String, default: '' },
          original_name: { type: String, default: '' },
          uploaded_at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DataChasis', dataChasisSchema);
