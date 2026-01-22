const MASTER_IMPORT_CONFIG = {
  truck: {
    label: "Truck",
    templateTitle: "Format Data Kendaraan",
    templateFileName: "Format-Data-Kendaraan.xlsx",
    exportFileName: "Data-Kendaraan.xlsx",
    table: "truck",
    orderBy: "id_truck",
    uniqueKey: "no_police",
    columns: [
      { header: "Jenis Kendaraan", field: "jenis_kendaraan", required: true },
      { header: "No. Police", field: "no_police", required: true },
      { header: "Merk Mobil", field: "merk_mobil", required: false },
      { header: "Model", field: "model", required: false },
      { header: "Type Kendaraan", field: "type_truck", required: false }
    ],
    headerRow: 3,
    dataStartRow: 4
  },
  driver: {
    label: "Driver",
    templateTitle: "Format Data Supir",
    templateFileName: "Format-Data-Supir.xlsx",
    exportFileName: "Data-Supir.xlsx",
    table: "driver",
    orderBy: "id_driver",
    uniqueKey: "no_polisi",
    columns: [
      { header: "No. Police", field: "no_polisi", required: true },
      { header: "Nama Driver", field: "nama_driver", required: true },
      { header: "No. Telp", field: "no_telp", required: false, type: "number" },
      { header: "No. KTP", field: "no_ktp", required: false, type: "number" },
      { header: "Alamat", field: "alamat", required: false }
    ],
    headerRow: 3,
    dataStartRow: 4
  },
  customer: {
    label: "Customer",
    templateTitle: "Format Data Customer",
    templateFileName: "Format-Data-Customer.xlsx",
    exportFileName: "Data-Customer.xlsx",
    table: "customer",
    orderBy: "id_customer",
    uniqueKey: "nama_customer",
    columns: [
      { header: "Nama Customer", field: "nama_customer", required: true },
      { header: "Alamat", field: "alamat", required: true },
      { header: "No. Telp", field: "no_telp", required: false, type: "number" },
      { header: "PIC", field: "pic", required: false }
    ],
    headerRow: 3,
    dataStartRow: 4
  },
  area: {
    label: "Rute",
    templateTitle: "Format Data Rute",
    templateFileName: "Format-Data-Rute.xlsx",
    exportFileName: "Data-Rute.xlsx",
    table: "area",
    orderBy: "id_area",
    uniqueKey: "nama_area",
    columns: [{ header: "Nama Rute", field: "nama_area", required: true }],
    headerRow: 3,
    dataStartRow: 4
  },
  route: {
    aliasOf: "area"
  },
  warehouse: {
    label: "Warehouse",
    templateTitle: "Format Data Warehouse",
    templateFileName: "Format-Data-Warehouse.xlsx",
    exportFileName: "Data-Warehouse.xlsx",
    table: "warehouse",
    orderBy: "id_warehouse",
    uniqueKey: "kode_warehouse",
    columns: [
      { header: "Kode Warehouse", field: "kode_warehouse", required: true },
      { header: "Nama Warehouse", field: "nm_warehouse", required: true },
      { header: "PIC", field: "pic_warehouse", required: false },
      { header: "Alamat", field: "alamat", required: false },
      { header: "Kontak", field: "kontak", required: false, type: "number" }
    ],
    headerRow: 3,
    dataStartRow: 4
  },
  subcont: {
    label: "Subcont",
    templateTitle: "Format Data SubCont",
    templateFileName: "Format-Data-SubCont.xlsx",
    exportFileName: "Data-SubCont.xlsx",
    table: "subcont",
    orderBy: "id_subcont",
    uniqueKey: "nama_subcont",
    columns: [
      { header: "Nama SubCont", field: "nama_subcont", required: true },
      { header: "PIC SubCont", field: "pic_subcont", required: true },
      { header: "Alamat", field: "alamat", required: false },
      { header: "No. Telp", field: "no_telp", required: false, type: "number" }
    ],
    headerRow: 3,
    dataStartRow: 4
  }
};

const resolveConfig = (type) => {
  if (!type) {
    return null;
  }
  const normalized = String(type).toLowerCase();
  const config = MASTER_IMPORT_CONFIG[normalized];
  if (!config) {
    return null;
  }
  if (config.aliasOf) {
    return MASTER_IMPORT_CONFIG[config.aliasOf] || null;
  }
  return config;
};

module.exports = {
  resolveConfig
};
