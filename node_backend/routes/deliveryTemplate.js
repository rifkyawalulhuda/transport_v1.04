const express = require("express");
const db = require("../db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchTemplateById(id) {
  const [rows] = await db.query(
    "SELECT * FROM delivery_template WHERE id = ?",
    [id]
  );
  if (!rows.length) return null;
  const template = rows[0];
  const [stops] = await db.query(
    "SELECT * FROM delivery_template_stop WHERE id_delivery_template = ? ORDER BY stop_order",
    [template.id]
  );
  template.stops = stops;
  return template;
}

function validateBody(body) {
  const { template_name, stops } = body;

  if (!template_name || !String(template_name).trim()) {
    return { ok: false, message: "template_name wajib diisi" };
  }
  if (!Array.isArray(stops) || stops.length === 0) {
    return { ok: false, message: "stops wajib diisi minimal satu item" };
  }

  const hasDeparture = stops.some(
    (s) => Number(s.is_departure) === 1 || s.is_departure === true
  );
  const hasFinish = stops.some(
    (s) => Number(s.is_finish) === 1 || s.is_finish === true
  );

  if (!hasDeparture) {
    return { ok: false, message: "Minimal satu stop harus bertanda is_departure=1" };
  }
  if (!hasFinish) {
    return { ok: false, message: "Minimal satu stop harus bertanda is_finish=1" };
  }

  return { ok: true };
}

async function insertStops(connection, templateId, stops) {
  for (const stop of stops) {
    await connection.query(
      `INSERT INTO delivery_template_stop
        (id_delivery_template, stop_order, stop_name,
         wialon_resource_id, wialon_zone_id, wialon_zone_name,
         is_departure, is_finish, time_hhmm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        stop.stop_order ?? null,
        stop.stop_name ?? null,
        stop.wialon_resource_id ?? null,
        stop.wialon_zone_id ?? null,
        stop.wialon_zone_name ?? null,
        stop.is_departure ? 1 : 0,
        stop.is_finish ? 1 : 0,
        stop.time_hhmm ?? null,
      ]
    );
  }
}

// ─── GET / — list all active templates with stops ────────────────────────────

router.get("/", authenticateToken, async (req, res) => {
  try {
    const [templates] = await db.query(
      "SELECT * FROM delivery_template WHERE is_active = 1 ORDER BY template_name"
    );

    for (const template of templates) {
      const [stops] = await db.query(
        "SELECT * FROM delivery_template_stop WHERE id_delivery_template = ? ORDER BY stop_order",
        [template.id]
      );
      template.stops = stops;
    }

    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /:id — single template detail ───────────────────────────────────────

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM delivery_template WHERE id = ? AND is_active = 1",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Template tidak ditemukan" });
    }

    const template = rows[0];
    const [stops] = await db.query(
      "SELECT * FROM delivery_template_stop WHERE id_delivery_template = ? ORDER BY stop_order",
      [template.id]
    );
    template.stops = stops;

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST / — create template (admin only) ───────────────────────────────────

router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  const validation = validateBody(req.body || {});
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message });
  }

  const { template_name, description, stops } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO delivery_template (template_name, description, is_active) VALUES (?, ?, 1)",
      [String(template_name).trim(), description ?? null]
    );

    const templateId = result.insertId;
    await insertStops(connection, templateId, stops);

    await connection.commit();

    const created = await fetchTemplateById(templateId);
    res.status(201).json(created);
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

// ─── PUT /:id — update template (admin only) ─────────────────────────────────

router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const validation = validateBody(req.body || {});
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message });
  }

  const { template_name, description, stops } = req.body;
  const { id } = req.params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT id FROM delivery_template WHERE id = ? AND is_active = 1",
      [id]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Template tidak ditemukan" });
    }

    await connection.query(
      "UPDATE delivery_template SET template_name = ?, description = ? WHERE id = ?",
      [String(template_name).trim(), description ?? null, id]
    );

    await connection.query(
      "DELETE FROM delivery_template_stop WHERE id_delivery_template = ?",
      [id]
    );

    await insertStops(connection, id, stops);

    await connection.commit();

    const updated = await fetchTemplateById(id);
    res.json(updated);
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

// ─── DELETE /:id — soft delete (admin only) ──────────────────────────────────

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id FROM delivery_template WHERE id = ? AND is_active = 1",
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Template tidak ditemukan" });
    }

    await db.query(
      "UPDATE delivery_template SET is_active = 0 WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Template dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
