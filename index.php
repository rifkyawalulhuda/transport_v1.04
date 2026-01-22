<?php 
session_start();
 $koneksi = mysqli_connect("localhost","root","123457sankyu","trucking");
// $user = 'root';
// $password = '';
// $db = 'trucking';
// $host = 'localhost';
// $port = 3309;

// $link = mysqli_init();
// $success = mysqli_real_connect(
//    $link, 
//    $host, 
//    $user, 
//    $password, 
//    $db,
//    $port
// );

if (!isset($_SESSION['nik_admin'])) 
{
  echo "<script>alert('Anda Harus Login');</script>";
  echo "<script>location='login.php';</script>";
  header('location:login.php');
  exit();
}
?>
<!DOCTYPE html>
<html>
<head>
	<title></title>
</head>
<body>

</body>
</html>