const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { createNotification, getActorFromRequest } = require("../services/notificationService");

const router = express.Router();

const notifyMasterChange = async ({ req, type, title, action, identifier, entityId }) => {
  const actor = getActorFromRequest(req);
  if (!actor) {
    return;
  }
  try {
    const actorName = actor.nama_admin || "Admin";
    await createNotification({
      type,
      title,
      message: `${actorName} ${action} Master Customer (${identifier})`,
      actor,
      entity: "customer",
      entityId,
      meta: { route: "/master/customers" }
    });
  } catch (error) {
    console.error("Failed to create master customer notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_customer, nama_customer, alamat, no_telp, pic FROM customer ORDER BY id_customer ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      "SELECT id_customer, nama_customer, alamat, no_telp, pic FROM customer WHERE id_customer = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const body = req.body || {};
    const namaCustomer = body.nama_customer || "";
    const alamat = body.alamat || "";
    const noTelp = body.no_telp || "";
    const pic = body.pic || "";

    const [result] = await db.query(
      "INSERT INTO customer (nama_customer, alamat, no_telp, pic) VALUES (?, ?, ?, ?)",
      [namaCustomer, alamat, noTelp, pic]
    );

    const [rows] = await db.query(
      "SELECT id_customer, nama_customer, alamat, no_telp, pic FROM customer WHERE id_customer = ?",
      [result.insertId]
    );

    const identifier = rows[0]?.nama_customer || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterCustomer",
      title: "Master Customer ditambahkan",
      action: "menambahkan",
      identifier,
      entityId: result.insertId
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const namaCustomer = body.nama_customer || "";
    const alamat = body.alamat || "";
    const noTelp = body.no_telp || "";
    const pic = body.pic || "";

    const [result] = await db.query(
      "UPDATE customer SET nama_customer = ?, alamat = ?, no_telp = ?, pic = ? WHERE id_customer = ?",
      [namaCustomer, alamat, noTelp, pic, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const [rows] = await db.query(
      "SELECT id_customer, nama_customer, alamat, no_telp, pic FROM customer WHERE id_customer = ?",
      [id]
    );

    const identifier = rows[0]?.nama_customer || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterCustomer",
      title: "Master Customer diperbarui",
      action: "memperbarui",
      identifier,
      entityId: id
    });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const [existingRows] = await db.query(
      "SELECT nama_customer FROM customer WHERE id_customer = ?",
      [id]
    );
    const [result] = await db.query(
      "DELETE FROM customer WHERE id_customer = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const identifier = existingRows[0]?.nama_customer || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterCustomer",
      title: "Master Customer dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
