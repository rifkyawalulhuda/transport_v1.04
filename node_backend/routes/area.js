const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const {
  createNotification,
  getActorFromRequest
} = require("../services/notificationService");
const {
  attachRouteStepsToAreas,
  parseLegacyAreaName,
  resolveAreaPayload
} = require("../services/areaRouteService");

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
      message: `${actorName} ${action} Master Area (${identifier})`,
      actor,
      entity: "area",
      entityId,
      meta: { route: "/master/areas" }
    });
  } catch (error) {
    console.error("Failed to create master area notification", error);
  }
};

const loadAreas = async (queryable = db) => {
  const [rows] = await queryable.query(
    `
      SELECT
        id_area,
        kode_area,
        nama_area,
        finish_geofence_resource_id,
        finish_geofence_zone_id,
        finish_geofence_zone_name
      FROM area
      ORDER BY id_area ASC
    `
  );
  return attachRouteStepsToAreas(rows, queryable);
};

const loadAreaById = async (id, queryable = db) => {
  const [rows] = await queryable.query(
    `
      SELECT
        id_area,
        kode_area,
        nama_area,
        finish_geofence_resource_id,
        finish_geofence_zone_id,
        finish_geofence_zone_name
      FROM area
      WHERE id_area = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const [area] = await attachRouteStepsToAreas(rows, queryable);
  return area;
};

const persistRouteSteps = async (queryable, idArea, routeSteps) => {
  await queryable.query("DELETE FROM area_route_step WHERE id_area = ?", [idArea]);
  if (!Array.isArray(routeSteps) || routeSteps.length === 0) {
    return;
  }

  const values = routeSteps.map((step) => [
    idArea,
    step.step_order,
    step.step_name,
    step.wialon_resource_id,
    step.wialon_zone_id,
    step.wialon_zone_name
  ]);

  await queryable.query(
    `
      INSERT INTO area_route_step (
        id_area,
        step_order,
        step_name,
        wialon_resource_id,
        wialon_zone_id,
        wialon_zone_name
      )
      VALUES ?
    `,
    [values]
  );
};

const buildDraftRouteSteps = (area) => {
  if (Array.isArray(area?.route_steps) && area.route_steps.length > 0) {
    return area.route_steps;
  }

  const parsed = parseLegacyAreaName(area?.nama_area);
  return parsed.step_names.map((stepName, index) => ({
    id_area_route_step: null,
    step_order: index + 1,
    step_name: stepName,
    wialon_resource_id: null,
    wialon_zone_id: null,
    wialon_zone_name: ""
  }));
};

router.get("/", async (_req, res) => {
  try {
    const areas = await loadAreas();
    const enriched = areas.map((area) => ({
      ...area,
      draft_route_steps: buildDraftRouteSteps(area)
    }));
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const area = await loadAreaById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: "Area not found" });
    }

    res.json({
      ...area,
      draft_route_steps: buildDraftRouteSteps(area)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const payload = resolveAreaPayload(req.body || {});
  if (!payload.ok) {
    return res.status(400).json({ message: payload.message });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO area (
          kode_area,
          nama_area,
          finish_geofence_resource_id,
          finish_geofence_zone_id,
          finish_geofence_zone_name
        ) VALUES (?, ?, ?, ?, ?)
      `,
      [
        payload.kodeArea,
        payload.namaArea,
        payload.finishGeofence?.finish_geofence_resource_id || null,
        payload.finishGeofence?.finish_geofence_zone_id || null,
        payload.finishGeofence?.finish_geofence_zone_name || null
      ]
    );

    await persistRouteSteps(connection, result.insertId, payload.routeSteps);
    await connection.commit();

    const area = await loadAreaById(result.insertId);
    const identifier = area?.nama_area || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterArea",
      title: "Master Area ditambahkan",
      action: "menambahkan",
      identifier,
      entityId: result.insertId
    });

    res.status(201).json({
      ...area,
      draft_route_steps: buildDraftRouteSteps(area)
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const payload = resolveAreaPayload(req.body || {});
  if (!payload.ok) {
    return res.status(400).json({ message: payload.message });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        UPDATE area
        SET
          kode_area = ?,
          nama_area = ?,
          finish_geofence_resource_id = ?,
          finish_geofence_zone_id = ?,
          finish_geofence_zone_name = ?
        WHERE id_area = ?
      `,
      [
        payload.kodeArea,
        payload.namaArea,
        payload.finishGeofence?.finish_geofence_resource_id || null,
        payload.finishGeofence?.finish_geofence_zone_id || null,
        payload.finishGeofence?.finish_geofence_zone_name || null,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Area not found" });
    }

    await persistRouteSteps(connection, req.params.id, payload.routeSteps);
    await connection.commit();

    const area = await loadAreaById(req.params.id);
    const identifier = area?.nama_area || `ID ${req.params.id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterArea",
      title: "Master Area diperbarui",
      action: "memperbarui",
      identifier,
      entityId: req.params.id
    });

    res.json({
      ...area,
      draft_route_steps: buildDraftRouteSteps(area)
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const [existingRows] = await db.query(
      "SELECT nama_area FROM area WHERE id_area = ?",
      [req.params.id]
    );
    const [result] = await db.query("DELETE FROM area WHERE id_area = ?", [
      req.params.id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Area not found" });
    }
    const identifier = existingRows[0]?.nama_area || `ID ${req.params.id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterArea",
      title: "Master Area dihapus",
      action: "menghapus",
      identifier,
      entityId: req.params.id
    });
    res.json({ message: "Area deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
