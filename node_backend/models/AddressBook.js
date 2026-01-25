const mongoose = require("mongoose");

const addressBookSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    addressNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: "address_book"
  }
);

addressBookSchema.index({ label: "text", address: "text" });
addressBookSchema.index({ addressNormalized: 1 }, { unique: true });

module.exports = mongoose.model("AddressBook", addressBookSchema);
