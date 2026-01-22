<?php 
// mengaktifkan session pada php
session_start();
 
// menghubungkan php dengan koneksi database
// $koneksi = mysqli_connect("localhost","root","123457sankyu","trucking");

$user = 'root';
$password = '123457sankyu';
$db = 'trucking';
$host = 'localhost';

$koneksi = mysqli_init();
$success = mysqli_real_connect(
   $koneksi, 
   $host, 
   $user, 
   $password, 
   $db
);
 
// menangkap data yang dikirim dari form login
$nik_admin = $_POST['nik_admin'];
$password = $_POST['password'];

  
// menyeleksi data user dengan username dan password yang sesuai
$login = mysqli_query($koneksi,"select * from admin where nik_admin='$nik_admin' and password='$password'");
// menghitung jumlah data yang ditemukan
$cek = mysqli_num_rows($login);
// echo "<script>alert($login);</script>";
// cek apakah username dan password di temukan pada database
if($cek > 0){
	
	$data = mysqli_fetch_assoc($login);
 
	// cek jika user login sebagai admin
	if($data['level']=="admin"){

		// buat session login dan username
		$_SESSION['nama_admin'] = $data['nama_admin'];
		$_SESSION['nik_admin'] = $nik_admin;
		$_SESSION['level'] = "admin";
		// alihkan ke halaman dashboard admin
		header("location:admin/index.php");
 
	// cek jika user login sebagai pegawai
	}else if($data['level']=="user"){
		// buat session login dan username
		$_SESSION['nama_admin'] = $data['nama_admin'];
		$_SESSION['nik_admin'] = $nik_admin;
		$_SESSION['level'] = "user";
			
		// alihkan ke halaman dashboard pegawai
		header("location:admin/index.php");

	}else{
 
		// alihkan ke halaman login kembali
		header("location:gagal.php");
	}	
}else{
	
	header("location:gagal.php");
}
 
?>