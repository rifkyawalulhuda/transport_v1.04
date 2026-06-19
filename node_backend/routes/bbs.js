const express = require("express");
const db = require("../db");
const xlsx = require("xlsx");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

const pad2 = (value) => String(value).padStart(2, "0");

const fmtDate = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

router.get("/dashboard", async (req, res) => {
  try {
    const monthParam = String(req.query.month || "").trim();
    let year, month;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const firstDay = `${monthStr}-01`;
    // Last day of month
    const lastDay = new Date(year, month, 0);
    const endDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    const [[obsCount], [safeCount], [nearMissCount], [incidentFree]] =
      await Promise.all([
        db.query(
          "SELECT COUNT(*) AS total FROM bbs_observations WHERE date >= ? AND date <= ?",
          [firstDay, endDay]
        ),
        db.query(
          "SELECT COUNT(*) AS total FROM bbs_observations WHERE date >= ? AND date <= ? AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o1')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o2')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o3')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o4')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o5')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o6')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o7')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o8')) = 'aman'",
          [firstDay, endDay]
        ),
        db.query(
          "SELECT COUNT(*) AS total FROM bbs_incidents WHERE type = 'Near-Miss' AND date >= ? AND date <= ?",
          [firstDay, endDay]
        ),
        db.query(
          `SELECT DATEDIFF(?, IFNULL((SELECT MAX(date) FROM bbs_incidents WHERE type <> 'Near-Miss' AND date <= ?), ?)) AS streak`,
          [endDay, endDay, firstDay]
        )
      ]);

    const totalObs = Number(obsCount[0]?.total || 0);
    const fullSafe = Number(safeCount[0]?.total || 0);
    const nearMiss = Number(nearMissCount[0]?.total || 0);
    const streak = Math.max(0, Number(incidentFree[0]?.streak || 0));

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevFirst = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;

    const [[prevObs], [prevSafeObs], [prevNearMiss]] = await Promise.all([
      db.query(
        "SELECT COUNT(*) AS total FROM bbs_observations WHERE date >= ? AND date < ?",
        [prevFirst, firstDay]
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM bbs_observations WHERE date >= ? AND date < ? AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o1')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o2')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o3')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o4')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o5')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o6')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o7')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o8')) = 'aman'",
        [prevFirst, firstDay]
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM bbs_incidents WHERE type = 'Near-Miss' AND date >= ? AND date < ?",
        [prevFirst, firstDay]
      )
    ]);

    const prevObsCount = Number(prevObs[0]?.total || 0);
    const prevSafeCount = Number(prevSafeObs[0]?.total || 0);
    const prevNearMissCount = Number(prevNearMiss[0]?.total || 0);

    const safeRate = totalObs > 0 ? Math.round((fullSafe / totalObs) * 100) : 0;

    const [[trendRows], [riskRows]] = await Promise.all([
      db.query(
        `SELECT DATE_FORMAT(date, '%Y-%m') AS m,
                COUNT(*) AS total,
                SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o1')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o2')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o3')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o4')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o5')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o6')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o7')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o8')) = 'aman' THEN 1 ELSE 0 END) AS safe_count
         FROM bbs_observations
         WHERE date >= DATE_SUB(?, INTERVAL 5 MONTH)
         GROUP BY m
         ORDER BY m ASC`,
        [firstDay]
      ),
      db.query(
        `SELECT
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o2')) = 'berisiko' OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o2')) = 'berbahaya' THEN 1 ELSE 0 END) AS speed_risk,
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o1')) = 'berisiko' OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o1')) = 'berbahaya' THEN 1 ELSE 0 END) AS seatbelt_risk,
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o4')) = 'berisiko' OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o4')) = 'berbahaya' THEN 1 ELSE 0 END) AS phone_risk,
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o3')) = 'berisiko' OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o3')) = 'berbahaya' THEN 1 ELSE 0 END) AS distance_risk,
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o5')) IN ('berisiko','berbahaya') OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o6')) IN ('berisiko','berbahaya') OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o7')) IN ('berisiko','berbahaya') OR JSON_UNQUOTE(JSON_EXTRACT(scores, '$.o8')) IN ('berisiko','berbahaya') THEN 1 ELSE 0 END) AS other_risk,
           COUNT(*) AS total
         FROM bbs_observations
         WHERE date >= ? AND date <= ?`,
        [firstDay, endDay]
      )
    ]);

    const trendLabels = [];
    const trendData = [];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = (trendRows || []).find((r) => r.m === key);
      const t = Number(row?.total || 0);
      const s = Number(row?.safe_count || 0);
      trendLabels.push(months[d.getMonth()]);
      trendData.push(t > 0 ? Math.round((s / t) * 100) : 0);
    }

    const risk = riskRows?.[0] || {};
    const riskTotal = Math.max(1, Number(risk.total || 0));
    const riskCategories = {
      speed: Math.round((Number(risk.speed_risk || 0) / riskTotal) * 100),
      seatbelt: Math.round((Number(risk.seatbelt_risk || 0) / riskTotal) * 100),
      phone: Math.round((Number(risk.phone_risk || 0) / riskTotal) * 100),
      distance: Math.round((Number(risk.distance_risk || 0) / riskTotal) * 100),
      other: Math.round((Number(risk.other_risk || 0) / riskTotal) * 100)
    };

    res.json({
      summary: {
        safe_behavior_rate: safeRate,
        prev_safe_rate: prevObsCount > 0
          ? Math.round((prevSafeCount / prevObsCount) * 100)
          : null,
        observations_this_month: totalObs,
        observation_target: 60,
        near_miss_count: nearMiss,
        prev_near_miss: prevNearMissCount,
        incident_free_days: streak
      },
      trend: {
        labels: trendLabels,
        data: trendData,
        target: 85
      },
      risks: {
        labels: ["Kecepatan", "Sabuk", "HP/Distraksi", "Jarak Aman", "Lainnya"],
        data: [
          riskCategories.speed,
          riskCategories.seatbelt,
          riskCategories.phone,
          riskCategories.distance,
          riskCategories.other
        ]
      },
      top_risks: [
        { label: "Melebihi batas kecepatan", value: riskCategories.speed },
        { label: "Tidak pakai sabuk", value: riskCategories.seatbelt },
        { label: "Penggunaan HP saat berkendara", value: riskCategories.phone },
        { label: "Jarak aman tidak terjaga", value: riskCategories.distance }
      ]
    });
  } catch (err) {
    console.error("BBS dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/observations", async (req, res) => {
  try {
    const user = req.user || {};
    const { driver_id, date, location, vehicle_type, scores, feedback, follow_up } =
      req.body || {};

    if (!driver_id || !date || !scores) {
      return res.status(400).json({ message: "Driver ID, tanggal, dan skor wajib diisi" });
    }

    const scoresJson = JSON.stringify(scores);

    const [result] = await db.query(
      `INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id_admin,
        user.nama_admin || "",
        String(driver_id).trim(),
        fmtDate(date),
        location || null,
        vehicle_type || null,
        scoresJson,
        feedback || null,
        follow_up || null
      ]
    );

    res.status(201).json({
      id: result.insertId,
      driver_id,
      date,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("BBS observation error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/checklists", async (req, res) => {
  try {
    const user = req.user || {};
    const { driver_id, plate_number, date, items } = req.body || {};

    if (!driver_id || !plate_number || !date || !items) {
      return res.status(400).json({ message: "Driver ID, plat, tanggal, dan item checklist wajib diisi" });
    }

    const itemsJson = JSON.stringify(items);
    const allItems = Object.values(items);
    const answered = allItems.filter((v) => v !== "" && v !== null && v !== undefined);
    const safe = allItems.filter((v) => v === "safe");
    const total = answered.length;
    const pct = total > 0 ? Math.round((safe.length / total) * 100) : 0;
    const status = pct >= 80 ? "passed" : "needs_fix";

    const [result] = await db.query(
      `INSERT INTO bbs_checklists (id_admin, driver_id, plate_number, date, items, score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id_admin,
        String(driver_id).trim(),
        String(plate_number).trim().toUpperCase(),
        fmtDate(date),
        itemsJson,
        pct,
        status
      ]
    );

    res.status(201).json({
      id: result.insertId,
      driver_id,
      plate_number,
      date,
      score: pct,
      status,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("BBS checklist error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/incidents", async (req, res) => {
  try {
    const user = req.user || {};
    const {
      reporter_name,
      date,
      type,
      location,
      latitude,
      longitude,
      plate_number,
      chronology,
      factors,
      casualties,
      recommendations
    } = req.body || {};

    if (!reporter_name || !type || !location || !date) {
      return res.status(400).json({ message: "Nama pelapor, jenis laporan, lokasi, dan tanggal wajib diisi" });
    }

    const factorsJson = Array.isArray(factors) ? JSON.stringify(factors) : null;
    const lat = Number.isFinite(Number(latitude)) ? Number(latitude) : null;
    const lng = Number.isFinite(Number(longitude)) ? Number(longitude) : null;

    const [result] = await db.query(
      `INSERT INTO bbs_incidents (id_admin, reporter_name, date, type, location, latitude, longitude, plate_number, chronology, factors, casualties, recommendations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id_admin,
        String(reporter_name).trim(),
        fmtDate(date),
        type,
        String(location).trim(),
        lat,
        lng,
        plate_number ? String(plate_number).trim().toUpperCase() : null,
        chronology || null,
        factorsJson,
        casualties || null,
        recommendations || null
      ]
    );

    res.status(201).json({
      id: result.insertId,
      reporter_name,
      date,
      type,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("BBS incident error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const type = String(req.query.type || "all").toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const search = String(req.query.search || "").trim();
    const month = String(req.query.month || "").trim();
    const driverId = String(req.query.driver_id || "").trim();
    const plateNumber = String(req.query.plate_number || "").trim();
    const statusFilter = String(req.query.status || "").trim();

    const results = [];

    const obsStatuses = ['aman', 'perlu_perhatian'];
    const chkStatuses = ['passed', 'needs_fix'];
    const incStatuses = ['Near-Miss', 'Insiden Ringan', 'Insiden Sedang', 'Insiden Berat'];

    const isObsFilter = statusFilter && obsStatuses.includes(statusFilter);
    const isChkFilter = statusFilter && chkStatuses.includes(statusFilter);
    const isIncFilter = statusFilter && incStatuses.includes(statusFilter);

    const buildObsWhere = () => {
      const conds = [];
      const params = [];
      if (search) { conds.push("(o.observer_name LIKE ? OR o.driver_id LIKE ? OR o.location LIKE ? OR d.nama_driver LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
      if (month) { conds.push("DATE_FORMAT(o.date, '%Y-%m') = ?"); params.push(month); }
      if (driverId) { conds.push("o.driver_id = ?"); params.push(driverId); }
      if (isObsFilter) {
        if (statusFilter === 'aman') { conds.push("JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o1')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o2')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o3')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o4')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o5')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o6')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o7')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o8')) = 'aman'"); }
        else { conds.push("NOT (JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o1')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o2')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o3')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o4')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o5')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o6')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o7')) = 'aman' AND JSON_UNQUOTE(JSON_EXTRACT(o.scores, '$.o8')) = 'aman')"); }
      }
      return { where: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
    };

    const buildChkWhere = () => {
      const conds = [];
      const params = [];
      if (search) { conds.push("(c.driver_id LIKE ? OR c.plate_number LIKE ? OR d.nama_driver LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      if (month) { conds.push("DATE_FORMAT(c.date, '%Y-%m') = ?"); params.push(month); }
      if (driverId) { conds.push("c.driver_id = ?"); params.push(driverId); }
      if (plateNumber) { conds.push("c.plate_number = ?"); params.push(plateNumber); }
      if (isChkFilter) {
        conds.push("c.status = ?"); params.push(statusFilter);
      }
      return { where: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
    };

    const buildIncWhere = () => {
      const conds = [];
      const params = [];
      if (search) { conds.push("(reporter_name LIKE ? OR location LIKE ? OR plate_number LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      if (month) { conds.push("DATE_FORMAT(date, '%Y-%m') = ?"); params.push(month); }
      if (driverId) { conds.push("reporter_name LIKE ?"); params.push(`%${driverId}%`); }
      if (plateNumber) { conds.push("plate_number = ?"); params.push(plateNumber); }
      if (isIncFilter) {
        conds.push("type = ?"); params.push(statusFilter);
      }
      return { where: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
    };

    // When type=all but a type-specific status is selected, only query that type
    const shouldQueryObs = (type === "all" && !isChkFilter && !isIncFilter) || type === "observasi" || type === "observation";
    const shouldQueryChk = (type === "all" && !isObsFilter && !isIncFilter) || type === "checklist";
    const shouldQueryInc = (type === "all" && !isObsFilter && !isChkFilter) || type === "insiden" || type === "incident";

    if (shouldQueryObs) {
      const { where, params } = buildObsWhere();
      const [rows] = await db.query(
        `SELECT o.id_observation AS id, 'observation' AS type, o.observer_name, o.driver_id, o.date, o.location,
                o.feedback, o.follow_up, o.scores, o.created_at, d.nama_driver
         FROM bbs_observations o
         LEFT JOIN driver d ON o.driver_id = d.id_driver
         ${where}
         ORDER BY o.created_at DESC
         LIMIT ?`,
        [...params, limit]
      );
      results.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "observation",
          title: `Observasi — ${r.nama_driver || r.driver_id}`,
          meta: `${fmtDate(r.date)} · ${r.observer_name}`,
          status: computeObsStatus(r.scores),
          icon: "eye",
          created_at: r.created_at
        }))
      );
    }

    if (shouldQueryChk) {
      const { where, params } = buildChkWhere();
      const [rows] = await db.query(
        `SELECT c.id_checklist AS id, 'checklist' AS type, c.driver_id, c.plate_number, c.date,
                c.items, c.score, c.status, c.created_at, d.nama_driver
         FROM bbs_checklists c
         LEFT JOIN driver d ON c.driver_id = d.id_driver
         ${where}
         ORDER BY c.created_at DESC
         LIMIT ?`,
        [...params, limit]
      );
      results.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "checklist",
          title: `Checklist — ${r.plate_number}`,
          meta: `${fmtDate(r.date)} · ${r.nama_driver || r.driver_id} · ${r.score}% OK`,
          status: r.status === "passed" ? "Lulus" : "Perlu Perbaikan",
          icon: "checklist",
          score: r.score,
          created_at: r.created_at
        }))
      );
    }

    if (shouldQueryInc) {
      const { where, params } = buildIncWhere();
      const [rows] = await db.query(
        `SELECT id_incident AS id, 'incident' AS type, reporter_name, date, type AS incident_type,
                location, plate_number, chronology, factors, casualties, recommendations, created_at
         FROM bbs_incidents
         ${where}
         ORDER BY created_at DESC
         LIMIT ?`,
        [...params, limit]
      );
      results.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "incident",
          title: `${r.incident_type} — ${r.location}`,
          meta: `${fmtDate(r.date)} · ${r.reporter_name}`,
          status: r.incident_type,
          icon: "alert",
          created_at: r.created_at
        }))
      );
    }

    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = Math.min(results.length, limit);
    res.json({
      rows: results.slice(offset, offset + limit),
      pagination: {
        offset,
        limit,
        total
      }
    });
  } catch (err) {
    console.error("BBS history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const computeObsStatus = (scores) => {
  try {
    const obj = typeof scores === "string" ? JSON.parse(scores) : scores;
    const values = Object.values(obj || {});
    const allAman = values.length > 0 && values.every((v) => v === "aman");
    return allAman ? "Aman" : "Perlu Perhatian";
  } catch {
    return "Perlu Perhatian";
  }
};

router.get("/observations/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT o.*, d.nama_driver FROM bbs_observations o LEFT JOIN driver d ON o.driver_id = d.id_driver WHERE o.id_observation = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Observasi tidak ditemukan" });
    const r = rows[0];
    res.json({ ...r, scores: typeof r.scores === "string" ? JSON.parse(r.scores) : r.scores });
  } catch (err) {
    console.error("BBS get observation error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/observations/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const { driver_id, date, location, vehicle_type, scores, feedback, follow_up } = body;
    if (!driver_id || !date || !scores) {
      return res.status(400).json({ message: "Driver ID, tanggal, dan skor wajib diisi" });
    }
    const scoresJson = JSON.stringify(scores);
    const [result] = await db.query(
      `UPDATE bbs_observations SET driver_id=?, date=?, location=?, vehicle_type=?, scores=?, feedback=?, follow_up=? WHERE id_observation=?`,
      [String(driver_id).trim(), fmtDate(date), location || null, vehicle_type || null, scoresJson, feedback || null, follow_up || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Observasi tidak ditemukan" });
    res.json({ id: Number(req.params.id), driver_id, date });
  } catch (err) {
    console.error("BBS update observation error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/checklists/today-plates", async (req, res) => {
  try {
    const today = fmtDate(new Date());
    const [rows] = await db.query(
      "SELECT DISTINCT plate_number FROM bbs_checklists WHERE date = ?",
      [today]
    );
    res.json({ plates: rows.map((r) => r.plate_number) });
  } catch (err) {
    console.error("BBS today-plates error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/checklists/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT c.*, d.nama_driver FROM bbs_checklists c LEFT JOIN driver d ON c.driver_id = d.id_driver WHERE c.id_checklist = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Checklist tidak ditemukan" });
    const r = rows[0];
    res.json({ ...r, items: typeof r.items === "string" ? JSON.parse(r.items) : r.items });
  } catch (err) {
    console.error("BBS get checklist error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/checklists/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const { driver_id, plate_number, date, items } = body;
    if (!driver_id || !plate_number || !date || !items) {
      return res.status(400).json({ message: "Driver ID, plat, tanggal, dan item checklist wajib diisi" });
    }
    const itemsJson = JSON.stringify(items);
    const allItems = Object.values(items);
    const answered = allItems.filter((v) => v !== "" && v !== null && v !== undefined);
    const safe = allItems.filter((v) => v === "safe");
    const total = answered.length;
    const pct = total > 0 ? Math.round((safe.length / total) * 100) : 0;
    const status = pct >= 80 ? "passed" : "needs_fix";
    const [result] = await db.query(
      `UPDATE bbs_checklists SET driver_id=?, plate_number=?, date=?, items=?, score=?, status=? WHERE id_checklist=?`,
      [String(driver_id).trim(), String(plate_number).trim().toUpperCase(), fmtDate(date), itemsJson, pct, status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Checklist tidak ditemukan" });
    res.json({ id: Number(req.params.id), driver_id, plate_number, date, score: pct, status });
  } catch (err) {
    console.error("BBS update checklist error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/incidents/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM bbs_incidents WHERE id_incident = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Insiden tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    console.error("BBS get incident error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/incidents/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const { reporter_name, date, type, location, latitude, longitude, plate_number, chronology, factors, casualties, recommendations } = body;
    if (!reporter_name || !type || !location || !date) {
      return res.status(400).json({ message: "Nama pelapor, jenis laporan, lokasi, dan tanggal wajib diisi" });
    }
    const factorsJson = Array.isArray(factors) ? JSON.stringify(factors) : null;
    const lat = Number.isFinite(Number(latitude)) ? Number(latitude) : null;
    const lng = Number.isFinite(Number(longitude)) ? Number(longitude) : null;
    const [result] = await db.query(
      `UPDATE bbs_incidents SET reporter_name=?, date=?, type=?, location=?, latitude=?, longitude=?, plate_number=?, chronology=?, factors=?, casualties=?, recommendations=? WHERE id_incident=?`,
      [String(reporter_name).trim(), fmtDate(date), type, String(location).trim(), lat, lng, plate_number || null, chronology || null, factorsJson, casualties || null, recommendations || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Insiden tidak ditemukan" });
    res.json({ id: Number(req.params.id), reporter_name, date, type });
  } catch (err) {
    console.error("BBS update incident error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/observations/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM bbs_observations WHERE id_observation = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Observasi tidak ditemukan" });
    res.json({ message: "Observasi dihapus" });
  } catch (err) {
    console.error("BBS delete observation error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/checklists/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM bbs_checklists WHERE id_checklist = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Checklist tidak ditemukan" });
    res.json({ message: "Checklist dihapus" });
  } catch (err) {
    console.error("BBS delete checklist error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/incidents/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM bbs_incidents WHERE id_incident = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Insiden tidak ditemukan" });
    res.json({ message: "Insiden dihapus" });
  } catch (err) {
    console.error("BBS delete incident error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const range = String(req.query.range || "month").toLowerCase();
    const month = String(req.query.month || "").trim();
    const year = String(req.query.year || "").trim();

    let dateCond = "";
    const dateParams = [];

    if (range === "month" && month) {
      dateCond = "DATE_FORMAT(date, '%Y-%m') = ?";
      dateParams.push(month);
    } else if (range === "year" && year) {
      dateCond = "YEAR(date) = ?";
      dateParams.push(year);
    }

    const obsWhere = dateCond ? `WHERE ${dateCond}` : "";
    const chkWhere = dateCond ? `WHERE ${dateCond}` : "";
    const incWhere = dateCond ? `WHERE ${dateCond}` : "";

    const [[obsRows], [chkRows], [incRows]] = await Promise.all([
      db.query(
        `SELECT o.id_observation, o.observer_name, o.driver_id, d.nama_driver,
                o.date, o.location, o.vehicle_type, o.scores, o.feedback, o.follow_up, o.created_at
         FROM bbs_observations o
         LEFT JOIN driver d ON o.driver_id = d.id_driver
         ${obsWhere}
         ORDER BY o.date DESC`,
        dateParams
      ),
      db.query(
        `SELECT c.id_checklist, c.driver_id, d.nama_driver, c.plate_number,
                c.date, c.score, c.status, c.items, c.created_at
         FROM bbs_checklists c
         LEFT JOIN driver d ON c.driver_id = d.id_driver
         ${chkWhere}
         ORDER BY c.date DESC`,
        dateParams
      ),
      db.query(
        `SELECT id_incident, reporter_name, date, type, location, plate_number,
                chronology, factors, casualties, recommendations, created_at
         FROM bbs_incidents
         ${incWhere}
         ORDER BY date DESC`,
        dateParams
      ),
    ]);

    const scoreLabels = {
      o1: "Sabuk Pengaman",
      o2: "Kecepatan",
      o3: "Jarak Aman",
      o4: "HP/Distraksi",
      o5: "Rambu & Marka",
      o6: "Kondisi Kendaraan",
      o7: "Kelelahan",
      o8: "Lainnya",
    };

    const obsData = obsRows.map((r) => {
      const scores = typeof r.scores === "string" ? JSON.parse(r.scores) : (r.scores || {});
      const row = {
        "ID": r.id_observation,
        "Observer": r.observer_name,
        "Driver ID": r.driver_id,
        "Nama Driver": r.nama_driver || "-",
        "Tanggal": fmtDate(r.date),
        "Lokasi": r.location || "-",
        "Jenis Kendaraan": r.vehicle_type || "-",
      };
      Object.entries(scoreLabels).forEach(([key, label]) => {
        row[label] = scores[key] || "-";
      });
      row["Feedback"] = r.feedback || "-";
      row["Tindak Lanjut"] = r.follow_up || "-";
      return row;
    });

    const chkData = chkRows.map((r) => ({
      "ID": r.id_checklist,
      "Driver ID": r.driver_id,
      "Nama Driver": r.nama_driver || "-",
      "Plat Kendaraan": r.plate_number,
      "Tanggal": fmtDate(r.date),
      "Skor (%)": r.score,
      "Status": r.status === "passed" ? "Lulus" : "Perlu Perbaikan",
    }));

    const incData = incRows.map((r) => ({
      "ID": r.id_incident,
      "Pelapor": r.reporter_name,
      "Tanggal": fmtDate(r.date),
      "Jenis": r.type,
      "Lokasi": r.location,
      "Plat": r.plate_number || "-",
      "Kronologi": r.chronology || "-",
      "Faktor": Array.isArray(r.factors) ? r.factors.join(", ") : (typeof r.factors === "string" ? (() => { try { return JSON.parse(r.factors).join(", "); } catch { return r.factors; } })() : "-"),
      "Korban/Kerugian": r.casualties || "-",
      "Rekomendasi": r.recommendations || "-",
    }));

    const workbook = xlsx.utils.book_new();

    if (obsData.length > 0) {
      const obsSheet = xlsx.utils.json_to_sheet(obsData);
      obsSheet["!cols"] = Array(Object.keys(obsData[0]).length).fill({ wch: 18 });
      xlsx.utils.book_append_sheet(workbook, obsSheet, "Observasi");
    }

    if (chkData.length > 0) {
      const chkSheet = xlsx.utils.json_to_sheet(chkData);
      chkSheet["!cols"] = Array(Object.keys(chkData[0]).length).fill({ wch: 18 });
      xlsx.utils.book_append_sheet(workbook, chkSheet, "Checklist");
    }

    if (incData.length > 0) {
      const incSheet = xlsx.utils.json_to_sheet(incData);
      incSheet["!cols"] = Array(Object.keys(incData[0]).length).fill({ wch: 18 });
      xlsx.utils.book_append_sheet(workbook, incSheet, "Insiden");
    }

    if (!obsData.length && !chkData.length && !incData.length) {
      const emptySheet = xlsx.utils.aoa_to_sheet([["Tidak ada data untuk periode yang dipilih"]]);
      xlsx.utils.book_append_sheet(workbook, emptySheet, "Kosong");
    }

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    let filename = "BBS_Riwayat";
    if (range === "month" && month) filename += `_${month}`;
    else if (range === "year" && year) filename += `_${year}`;
    else filename += "_Semua";
    filename += ".xlsx";

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("BBS export error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
