const express = require("express");
const ExcelJS = require("exceljs");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { createNotification, getActorFromRequest } = require("../services/notificationService");
const {
  fetchRepairs,
  fetchRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  fetchRepairsForExport,
  fetchRepairYears,
  fetchRepairProcessNotifications
} = require("../services/repairService");

const router = express.Router();

const notifyRepairChange = async ({ req, type, title, action, identifier, entityId }) => {
  const actor = getActorFromRequest(req);
  if (!actor) {
    return;
  }
  try {
    const actorName = actor.nama_admin || "Admin";
    await createNotification({
      type,
      title,
      message: `${actorName} ${action} Repair (${identifier})`,
      actor,
      entity: "repair",
      entityId,
      meta: { route: "/repair" }
    });
  } catch (error) {
    console.error("Failed to create repair notification", error);
  }
};

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return numeric;
};

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const rows = await fetchRepairs(req.query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const rows = await fetchRepairsForExport(req.query);
    if (!rows.length) {
      return res.status(404).json({ message: "Tidak ada data untuk diexport." });
    }

    const filename = "Laporan-Repair.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true
    });
    const worksheet = workbook.addWorksheet("Laporan Repair");

    worksheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "No. SPK Perbaikan", key: "no_spk_perbaikan", width: 18 },
      { header: "No. Police", key: "no_police", width: 16 },
      { header: "Maker", key: "merk_mobil", width: 18 },
      { header: "Kategori Perbaikan", key: "kategori_repair", width: 20 },
      { header: "Tanggal Input", key: "tgl_input", width: 14 },
      { header: "Tanggal Kerusakan", key: "tgl_kerusakan", width: 16 },
      { header: "Tanggal Maintenance", key: "jadwal_berkala", width: 18 },
      { header: "Status Repair", key: "status_repair", width: 18 },
      { header: "Estimasi Tanggal Selesai", key: "tgl_proses", width: 20 },
      { header: "Tanggal Selesai", key: "tgl_selesai", width: 16 },
      { header: "Kilometer", key: "kilometer", width: 14 },
      { header: "Jenis Kerusakan", key: "jenis_kerusakan", width: 18 },
      { header: "Spare Part", key: "spare_part", width: 18 },
      { header: "Keterangan", key: "keterangan", width: 22 },
      { header: "Biaya Perbaikan", key: "biaya_perbaikan", width: 18 }
    ];
    worksheet.getColumn("biaya_perbaikan").numFmt = "#,##0";

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.commit();

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    rows.forEach((row, index) => {
      worksheet.addRow({
        no: index + 1,
        no_spk_perbaikan: row.no_spk_perbaikan || "",
        no_police: row.no_police || "",
        merk_mobil: row.merk_mobil || "",
        kategori_repair: row.kategori_repair || "",
        tgl_input: formatDate(row.tgl_input),
        tgl_kerusakan: formatDate(row.tgl_kerusakan),
        jadwal_berkala: formatDate(row.jadwal_berkala),
        status_repair: row.status_repair || "",
        tgl_proses: formatDate(row.tgl_proses),
        tgl_selesai: formatDate(row.tgl_selesai),
        kilometer: row.kilometer || "",
        jenis_kerusakan: row.jenis_kerusakan || "",
        spare_part: row.spare_part || "",
        keterangan: row.keterangan || "",
        biaya_perbaikan: formatNumber(row.biaya_perbaikan)
      }).commit();
    });

    await workbook.commit();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/notifications/proses", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const result = await fetchRepairProcessNotifications({ limit });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/years", async (req, res) => {
  try {
    const years = await fetchRepairYears(req.query);
    res.json(years);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const detail = await fetchRepairById(req.params.id);
    if (!detail) {
      return res.status(404).json({ message: "Repair tidak ditemukan." });
    }
    res.json(detail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = {
      ...(req.body || {}),
      nik_admin: req.user?.nik_admin ?? req.user?.id_admin ?? req.body?.nik_admin ?? null
    };
    if (!payload.id_truck) {
      return res.status(400).json({ message: "Truck wajib dipilih." });
    }
    const created = await createRepair(payload);
    if (!created) {
      return res.status(400).json({ message: "Gagal menambahkan repair." });
    }

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    const status = error?.status;
    if (status === 400) {
      return res.status(400).json({ message: error.message || "Input tidak valid." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = {
      ...(req.body || {}),
      nik_admin: req.user?.nik_admin ?? req.user?.id_admin ?? req.body?.nik_admin ?? null
    };
    if (!payload.id_truck) {
      return res.status(400).json({ message: "Truck wajib dipilih." });
    }
    const updated = await updateRepair(req.params.id, payload);
    if (!updated) {
      return res.status(404).json({ message: "Repair tidak ditemukan." });
    }

    const identifier = updated.no_spk_perbaikan || `ID ${updated.id_repair}`;
    await notifyRepairChange({
      req,
      type: "Updated-Repair",
      title: "Transaksi Repair diperbarui",
      action: "memperbarui",
      identifier,
      entityId: updated.id_repair
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    const status = error?.status;
    if (status === 400) {
      return res.status(400).json({ message: error.message || "Input tidak valid." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteRepair(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Repair tidak ditemukan." });
    }

    const identifier = deleted.no_spk_perbaikan || `ID ${deleted.id_repair}`;
    await notifyRepairChange({
      req,
      type: "Deleted-Repair",
      title: "Transaksi Repair dihapus",
      action: "menghapus",
      identifier,
      entityId: deleted.id_repair
    });

    res.json({ message: "Repair berhasil dihapus." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
