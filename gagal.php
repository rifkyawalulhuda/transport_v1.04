<?php 
session_start();
$koneksi = new mysqli("localhost","root","123457sankyu","trucking");
// $user = 'root';
// $password = '';
// $db = 'trucking';
// $host = 'localhost';

// $koneksi = mysqli_init();
// $success = mysqli_real_connect(
//    $koneksi, 
//    $host, 
//    $user, 
//    $password, 
//    $db
   
// );
 ?>
<!DOCTYPE html>
<html >
<head>
  <meta charset="UTF-8">
  <title>Login Aplikasi</title>
  
  
  
      <link rel="stylesheet" href="css_login/style.css">
      <link href='nama-gambar.JPEG' rel='shortcut icon'>

  
      <script type="text/JavaScript">
<!--

//-->
      </script>
</head>

<body>
  <hgroup>
   <h1>Transport System</h1>
   <h3>Gagal Login, Salah Username atau Password</h3>
</hgroup>
<form method="POST" action="cek_login.php">
  <div class="group">
    <input name="nik_admin" type="text" id="id_admin" placeholder="ID User" >
    <span class="highlight"></span><span class="bar"></span>
   
  </div>
  <div class="group">
    <input name="password" type="password" id="password"  placeholder="Password" >
    <span class="highlight"></span><span class="bar"></span>
    
  </div>
  <button type="submit" class="button buttonBlue">Login</button>
</form>

  <script src='http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js'></script>

    <script  src="js/index.js"></script>

</body>
</html>
