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

const normalizeDateValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const fetchRepairs = async (query = {}) => {
  const { conditions, params } = buildFilters(query);

  let sql =
    "SELECT repair.id_repair, repair.tgl_kerusakan, repair.jadwal_berkala, repair.no_spk_perbaikan, repair.biaya_perbaikan, repair.id_truck, truck.no_police, truck.merk_mobil, truck.model FROM repair LEFT JOIN truck ON repair.id_truck = truck.id_truck";

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
    nik_admin: payload.nik_admin || null
  };

  const [result] = await db.query(
    "INSERT INTO repair (kategori_repair, id_truck, tgl_input, tgl_kerusakan, no_spk_perbaikan, kilometer, jenis_kerusakan, spare_part, jadwal_berkala, keterangan, biaya_perbaikan, nik_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      data.nik_admin
    ]
  );

  return fetchRepairById(result.insertId);
};

const updateRepair = async (id, payload = {}) => {
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
    nik_admin: payload.nik_admin || null
  };

  const [result] = await db.query(
    "UPDATE repair SET kategori_repair = ?, id_truck = ?, tgl_input = ?, tgl_kerusakan = ?, no_spk_perbaikan = ?, kilometer = ?, jenis_kerusakan = ?, spare_part = ?, jadwal_berkala = ?, keterangan = ?, biaya_perbaikan = ?, nik_admin = ? WHERE id_repair = ?",
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
    "SELECT repair.id_repair, repair.kategori_repair, repair.id_truck, repair.tgl_input, repair.tgl_kerusakan, repair.no_spk_perbaikan, repair.kilometer, repair.jenis_kerusakan, repair.spare_part, repair.jadwal_berkala, repair.keterangan, repair.biaya_perbaikan, repair.nik_admin, truck.no_police, truck.jenis_kendaraan, truck.merk_mobil, truck.model FROM repair LEFT JOIN truck ON repair.id_truck = truck.id_truck";

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY repair.id_repair DESC";

  const [rows] = await db.query(sql, params);
  return rows;
};

module.exports = {
  buildFilters,
  fetchRepairs,
  fetchRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  fetchRepairsForExport
};
