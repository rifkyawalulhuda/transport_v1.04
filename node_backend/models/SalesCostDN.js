const mongoose = require("mongoose");

const dnItemSchema = new mongoose.Schema({
  no_dn: {
    type: String,
    maxlength: 20,
    trim: true,
  },
  pickup_alamat: String,
  drop_alamat: String,
  qty: String,
  pkg: {
    type: String,
    enum: ["IBC", "CTN", "PIL", "DRM", "", null],
  },
  gw: String,
  no_container: String,
  no_aju: String,
  remarks: String,
});

const salesCostDNSchema = new mongoose.Schema(
  {
    salesCostId: {
      type: Number,
      required: true,
      unique: true, // Satu Sales Cost hanya punya satu dokumen DN List
      index: true,
    },
    items: [dnItemSchema],
  },
  {
    timestamps: true, // createAt, updatedAt
    collection: "sales_cost_dn",
  }
);

module.exports = mongoose.model("SalesCostDN", salesCostDNSchema);
