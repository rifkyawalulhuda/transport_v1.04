const express = require("express");
const mongoose = require("mongoose");
const AddressBook = require("../models/AddressBook");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseLimit = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

router.get("/suggest", authenticateToken, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseLimit(req.query.limit, 10), 20);

    let items = [];
    if (q.length < 2) {
      const defaultLimit = Math.min(parseLimit(req.query.limit, 5), 5);
      items = await AddressBook.find({}, { label: 1, address: 1, usageCount: 1 })
        .sort({ usageCount: -1, updatedAt: -1 })
        .limit(defaultLimit)
        .lean();
    } else {
      try {
        items = await AddressBook.find(
          { $text: { $search: q } },
          { score: { $meta: "textScore" }, label: 1, address: 1, usageCount: 1 }
        )
          .sort({ score: { $meta: "textScore" }, usageCount: -1, updatedAt: -1 })
          .limit(limit)
          .lean();
      } catch (error) {
        const regex = new RegExp(escapeRegExp(q), "i");
        items = await AddressBook.find(
          { $or: [{ address: regex }, { label: regex }] },
          { label: 1, address: 1, usageCount: 1 }
        )
          .sort({ usageCount: -1, updatedAt: -1 })
          .limit(limit)
          .lean();
      }
    }

    return res.json({ items });
  } catch (error) {
    console.error("Address book suggest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/use", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    const item = await AddressBook.findByIdAndUpdate(
      id,
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({ item });
  } catch (error) {
    console.error("Address book use error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/upsert", authenticateToken, async (req, res) => {
  try {
    const addressRaw = typeof req.body?.address === "string" ? req.body.address : "";
    const labelRaw = typeof req.body?.label === "string" ? req.body.label : "";
    const address = addressRaw.trim();
    const label = labelRaw.trim();

    if (!address || address.length < 5) {
      return res.status(400).json({ message: "Alamat tidak valid" });
    }

    const addressNormalized = address.toLowerCase();
    const update = {
      $setOnInsert: {
        address,
        addressNormalized
      },
      $inc: { usageCount: 1 },
      $set: { updatedAt: new Date() }
    };
    if (label) {
      update.$set.label = label;
    }

    const item = await AddressBook.findOneAndUpdate(
      { addressNormalized },
      update,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    return res.json({ item });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Alamat sudah ada" });
    }
    console.error("Address book upsert error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
