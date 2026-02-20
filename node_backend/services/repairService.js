const db = require("../db");

const DEFAULT_DATE_FIELD = "maintenance";

const normalizeDateField = (value) => {
  const field = String(value || "").toLowerCase();
  return field === "damage" ? "damage" : DEFAULT_DATE_FIELD;
};

const resolveDateColumn = (dateField) =>
  normalizeDateField(dateField) === "damage"
    ? "repair.tgl_kerusakan"
    : "repair.jadwal_berkala";

const buildFilters = (query = {}) => {
  const startDate = query.startDate || query.start_date || "";
  const endDate = query.endDate || query.end_date || "";
  const yearParam = String(query.year || "").trim();
  const year = Number.parseInt(yearParam, 10);
  const keyword = String(query.keyword || query.q || "").trim();
  const column = String(query.searchColumn || query.column || "all")
    .trim()
    .toLowerCase();
  const dateField = normalizeDateField(query.dateField);

  const conditions = [];
  const params = [];
  const dateColumn = resolveDateColumn(dateField);

  if (startDate) {
    conditions.push(`${dateColumn} >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`${dateColumn} <= ?`);
    params.push(endDate);
  }

  if (yearParam && Number.isInteger(year) && year >= 1900 && year <= 9999) {
    conditions.push(`YEAR(${dateColumn}) = ?`);
    params.push(year);
  }

  if (keyword) {
    const likeKeyword = `%${keyword}%`;
    const searchableColumns = {
      no_police: "truck.no_police",
      maker: "truck.merk_mobil",
      model: "truck.model",
      no_spk_perbaikan: "repair.no_spk_perbaikan"
    };

    if (column !== "all" && searchableColumns[column]) {
      conditions.push(`${searchableColumns[column]} LIKE ?`);
      params.push(likeKeyword);
    } else {
      const expressions = [
        "truck.no_police",
        "truck.merk_mobil",
        "truck.model",
        "repair.no_spk_perbaikan"
      ];
      const orConditions = expressions.map((expression) => `${expression} LIKE ?`);
      conditions.push(`(${orConditions.join(" OR ")})`);
      params.push(...orConditions.map(() => likeKeyword));
    }
  }

  return { conditions, params, dateField };
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const str = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(str);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const STATUS_REPAIR_VALUES = new Set(["PROSES", "SELESAI"]);

const normalizeDateValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const normalizeDateOnly = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeStatusRepair = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalized = String(value).trim().toUpperCase();
  return STATUS_REPAIR_VALUES.has(normalized) ? normalized : null;
};

const fetchRepairs = async (query = {}) => {
  const { conditions, params } = buildFilters(query);

  let sql =
    "SELECT repair.id_repair, repair.tgl_kerusakan, repair.jadwal_berkala, repair.no_spk_perbaikan, repair.biaya_perbaikan, repair.id_truck, repair.status_repair, repair.tgl_proses, repair.tgl_selesai, truck.no_police, truck.merk_mobil, truck.model FROM repair LEFT JOIN truck ON repair.id_truck = truck.id_truck";

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY repair.id_repair DESC";

  const [rows] = await db.query(sql, params);
  return rows;
};

const fetchRepairById = async (id) => {
  const [rows] = await db.query(
    "SELECT repair.*, truck.no_police, truck.jenis_kendaraan, truck.merk_mobil, truck.model FROM repair LEFT JOIN truck ON repair.id_truck = truck.id_truck WHERE repair.id_repair = ?",
    [id]
  );
  return rows[0] || null;
};

const createRepair = async (payload = {}) => {
  let statusRepair = "PROSES";
  if (payload.status_repair !== undefined && payload.status_repair !== null) {
    const normalized = normalizeStatusRepair(payload.status_repair);
    if (!normalized) {
      const error = new Error("Status repair tidak valid.");
      error.status = 400;
      throw error;
    }
    statusRepair = normalized;
  }

  const tglProsesValue = normalizeDateOnly(payload.tgl_proses);
  const tglSelesaiValue = normalizeDateOnly(payload.tgl_selesai);
  const resolvedTglProses = tglProsesValue || null;
  let resolvedTglSelesai = null;

  if (statusRepair === "SELESAI") {
    if (!tglSelesaiValue) {
      const error = new Error("Tanggal selesai wajib diisi");
      error.status = 400;
      throw error;
    }
    resolvedTglSelesai = tglSelesaiValue;
  }

  const data = {
    kategori_repair: payload.kategori_repair || "",
    id_truck: payload.id_truck || null,
    tgl_input: normalizeDateValue(payload.tgl_input),
    tgl_kerusakan: normalizeDateValue(payload.tgl_kerusakan),
    no_spk_perbaikan: payload.no_spk_perbaikan || "",
    kilometer: payload.kilometer || "",
    jenis_kerusakan: payload.jenis_kerusakan || "",
    spare_part: payload.spare_part || "",
    jadwal_berkala: normalizeDateValue(payload.jadwal_berkala),
    keterangan: payload.keterangan || "",
    biaya_perbaikan: parseNumber(payload.biaya_perbaikan),
    nik_admin: payload.nik_admin || null,
    status_repair: statusRepair,
    tgl_proses: resolvedTglProses,
    tgl_selesai: statusRepair === "PROSES" ? null : resolvedTglSelesai
  };

  const [result] = await db.query(
    "INSERT INTO repair (kategori_repair, id_truck, tgl_input, tgl_kerusakan, no_spk_perbaikan, kilometer, jenis_kerusakan, spare_part, jadwal_berkala, keterangan, biaya_perbaikan, nik_admin, status_repair, tgl_proses, tgl_selesai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.kategori_repair,
      data.id_truck,
      data.tgl_input,
      data.tgl_kerusakan,
      data.no_spk_perbaikan,
      data.kilometer,
      data.jenis_kerusakan,
      data.spare_part,
      data.jadwal_berkala,
      data.keterangan,
      data.biaya_perbaikan,
      data.nik_admin,
      data.status_repair,
      data.tgl_proses,
      data.tgl_selesai
    ]
  );

  return fetchRepairById(result.insertId);
};

const updateRepair = async (id, payload = {}) => {
  const existing = await fetchRepairById(id);
  if (!existing) {
    return null;
  }

  let statusRepair = existing.status_repair || "PROSES";
  if (payload.status_repair !== undefined && payload.status_repair !== null) {
    const normalized = normalizeStatusRepair(payload.status_repair);
    if (!normalized) {
      const error = new Error("Status repair tidak valid.");
      error.status = 400;
      throw error;
    }
    statusRepair = normalized;
  }

  const tglProsesValue = normalizeDateOnly(payload.tgl_proses);
  const tglSelesaiValue = normalizeDateOnly(payload.tgl_selesai);
  const resolvedTglProses =
    tglProsesValue || normalizeDateOnly(existing.tgl_proses) || null;

  let resolvedTglSelesai = normalizeDateOnly(existing.tgl_selesai);
  if (statusRepair === "SELESAI") {
    if (payload.status_repair !== undefined && !tglSelesaiValue) {
      const error = new Error("Tanggal selesai wajib diisi");
      error.status = 400;
      throw error;
    }
    resolvedTglSelesai = tglSelesaiValue || resolvedTglSelesai;
    if (!resolvedTglSelesai) {
      const error = new Error("Tanggal selesai wajib diisi");
      error.status = 400;
      throw error;
    }
  } else {
    resolvedTglSelesai = null;
  }

  const data = {
    kategori_repair: payload.kategori_repair || "",
    id_truck: payload.id_truck || null,
    tgl_input: normalizeDateValue(payload.tgl_input),
    tgl_kerusakan: normalizeDateValue(payload.tgl_kerusakan),
    no_spk_perbaikan: payload.no_spk_perbaikan || "",
    kilometer: payload.kilometer || "",
    jenis_kerusakan: payload.jenis_kerusakan || "",
    spare_part: payload.spare_part || "",
    jadwal_berkala: normalizeDateValue(payload.jadwal_berkala),
    keterangan: payload.keterangan || "",
    biaya_perbaikan: parseNumber(payload.biaya_perbaikan),
    nik_admin: payload.nik_admin || null,
    status_repair: statusRepair,
    tgl_proses: resolvedTglProses,
    tgl_selesai: resolvedTglSelesai
  };

  const [result] = await db.query(
    "UPDATE repair SET kategori_repair = ?, id_truck = ?, tgl_input = ?, tgl_kerusakan = ?, no_spk_perbaikan = ?, kilometer = ?, jenis_kerusakan = ?, spare_part = ?, jadwal_berkala = ?, keterangan = ?, biaya_perbaikan = ?, nik_admin = ?, status_repair = ?, tgl_proses = ?, tgl_selesai = ? WHERE id_repair = ?",
    [
      data.kategori_repair,
      data.id_truck,
      data.tgl_input,
      data.tgl_kerusakan,
      data.no_spk_perbaikan,
      data.kilometer,
      data.jenis_kerusakan,
      data.spare_part,
      data.jadwal_berkala,
      data.keterangan,
      data.biaya_perbaikan,
      data.nik_admin,
      data.status_repair,
      data.tgl_proses,
      data.tgl_selesai,
      id
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return fetchRepairById(id);
};

const deleteRepair = async (id) => {
  const detail = await fetchRepairById(id);
  if (!detail) {
    return null;
  }

  const [result] = await db.query("DELETE FROM repair WHERE id_repair = ?", [id]);
  if (result.affectedRows === 0) {
    return null;
  }

  return detail;
};

const fetchRepairsForExport = async (query = {}) => {
  const { conditions, params } = buildFilters(query);

  let sql =
    "SELECT repair.id_repair, repair.kategori_repair, repair.id_truck, repair.tgl_input, repair.tgl_kerusakan, repair.no_spk_perbaikan, repair.kilometer, repair.jenis_kerusakan, repair.spare_part, repair.jadwal_berkala, repair.keterangan, repair.biaya_perbaikan, repair.nik_admin, repair.status_repair, repair.tgl_proses, repair.tgl_selesai, truck.no_police, truck.jenis_kendaraan, truck.merk_mobil, truck.model FROM repair LEFT JOIN truck ON repair.id_truck = truck.id_truck";

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY repair.id_repair DESC";

  const [rows] = await db.query(sql, params);
  return rows;
};

const fetchRepairYears = async (query = {}) => {
  const dateField = normalizeDateField(query.dateField);
  const dateColumn = resolveDateColumn(dateField);
  const [rows] = await db.query(
    `SELECT DISTINCT YEAR(${dateColumn}) AS year
     FROM repair
     WHERE ${dateColumn} IS NOT NULL
     ORDER BY year DESC`
  );

  return rows
    .map((row) => Number.parseInt(String(row.year), 10))
    .filter((year) => Number.isInteger(year) && year >= 1900 && year <= 9999);
};

const fetchRepairProcessNotifications = async ({ limit = 10 } = {}) => {
  const safeLimit = Math.min(Number(limit) || 10, 50);
  const [[countRow]] = await db.query(
    "SELECT COUNT(*) AS total FROM repair WHERE status_repair = 'PROSES'"
  );
  const [rows] = await db.query(
    "SELECT repair.id_repair, repair.id_truck, repair.no_spk_perbaikan, repair.jenis_kerusakan, repair.tgl_proses, truck.no_police FROM repair LEFT JOIN truck ON repair.id_truck = truck.id_truck WHERE repair.status_repair = 'PROSES' ORDER BY repair.tgl_proses DESC, repair.id_repair DESC LIMIT ?",
    [safeLimit]
  );
  return {
    count: Number(countRow?.total || 0),
    items: rows
  };
};

module.exports = {
  buildFilters,
  fetchRepairs,
  fetchRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  fetchRepairsForExport,
  fetchRepairYears,
  fetchRepairProcessNotifications
};
