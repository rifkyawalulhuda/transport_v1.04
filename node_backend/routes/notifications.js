const express = require("express");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middleware/auth");
const Notification = require("../models/Notification");
const NotificationRead = require("../models/NotificationRead");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const ids = notifications.map((item) => item._id);
    const reads = await NotificationRead.find({
      id_admin: Number(idAdmin),
      notificationId: { $in: ids }
    }).lean();
    const readSet = new Set();
    const deletedSet = new Set();
    reads.forEach((item) => {
      const key = String(item.notificationId);
      if (item.readAt) {
        readSet.add(key);
      }
      if (item.deletedAt) {
        deletedSet.add(key);
      }
    });
    const data = notifications
      .filter((item) => !deletedSet.has(String(item._id)))
      .map((item) => ({
        ...item,
        read: readSet.has(String(item._id))
      }));
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }
    const readRows = await NotificationRead.find({ id_admin: Number(idAdmin) })
      .select("notificationId readAt deletedAt")
      .lean();
    const excludeIds = new Set();
    readRows.forEach((row) => {
      if (row.readAt || row.deletedAt) {
        excludeIds.add(String(row.notificationId));
      }
    });
    const excludeArray = Array.from(excludeIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const filter = excludeArray.length ? { _id: { $nin: excludeArray } } : {};
    const count = await Notification.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/read", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }
    const notificationId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Notification ID tidak valid" });
    }
    await NotificationRead.findOneAndUpdate(
      {
        notificationId,
        id_admin: Number(idAdmin)
      },
      {
        $set: { readAt: new Date() },
        $setOnInsert: { id_admin: Number(idAdmin), notificationId }
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/read-all", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }
    const notifications = await Notification.find({}).select("_id").lean();
    const ids = notifications.map((item) => item._id);
    if (!ids.length) {
      return res.json({ success: true, inserted: 0 });
    }
    const existingReads = await NotificationRead.find({
      id_admin: Number(idAdmin),
      notificationId: { $in: ids }
    })
      .select("notificationId")
      .lean();
    const existingSet = new Set(existingReads.map((item) => String(item.notificationId)));
    const toInsert = ids
      .filter((id) => !existingSet.has(String(id)))
      .map((id) => ({
        notificationId: id,
        id_admin: Number(idAdmin),
        readAt: new Date()
      }));
    if (toInsert.length) {
      await NotificationRead.insertMany(toInsert, { ordered: false });
    }
    res.json({ success: true, inserted: toInsert.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/delete-many", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return res.status(400).json({ message: "Tidak ada notifikasi yang valid." });
    }
    const now = new Date();
    const operations = validIds.map((id) => ({
      updateOne: {
        filter: {
          id_admin: Number(idAdmin),
          notificationId: new mongoose.Types.ObjectId(id)
        },
        update: {
          $set: { deletedAt: now },
          $setOnInsert: { readAt: now }
        },
        upsert: true
      }
    }));
    if (operations.length) {
      await NotificationRead.bulkWrite(operations, { ordered: false });
    }
    res.json({ success: true, deleted: operations.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/delete-all", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }
    const notifications = await Notification.find({}).select("_id").lean();
    const ids = notifications.map((item) => item._id);
    if (!ids.length) {
      return res.json({ success: true, deleted: 0 });
    }
    const now = new Date();
    const operations = ids.map((id) => ({
      updateOne: {
        filter: { id_admin: Number(idAdmin), notificationId: id },
        update: {
          $set: { deletedAt: now },
          $setOnInsert: { readAt: now }
        },
        upsert: true
      }
    }));
    await NotificationRead.bulkWrite(operations, { ordered: false });
    res.json({ success: true, deleted: operations.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
