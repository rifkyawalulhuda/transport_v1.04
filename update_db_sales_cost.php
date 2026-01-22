<?php
$koneksi = mysqli_connect("localhost","root","123457sankyu","trucking");

if (mysqli_connect_errno()) {
  echo "Gagal koneksi ke MySQL: " . mysqli_connect_error();
  exit();
}

$sql = "SHOW COLUMNS FROM `sales_cost` LIKE 'container_size'";
$result = $koneksi->query($sql);

if ($result->num_rows == 0) {
    // Kolom belum ada, jalankan ALTER TABLE
    $alter = "ALTER TABLE `sales_cost` ADD COLUMN `container_size` VARCHAR(20) NULL AFTER `jenis_trip`";
    if ($koneksi->query($alter) === TRUE) {
        echo "Berhasil menambahkan kolom 'container_size' ke tabel 'sales_cost'.";
    } else {
        echo "Error menambahkan kolom: " . $koneksi->error;
    }
} else {
    echo "Kolom 'container_size' sudah ada di tabel 'sales_cost'. Tidak perlu update.";
}

$koneksi->close();
?>
