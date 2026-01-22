<?php
session_start();

session_destroy();
echo "<script>alert('Anda Telah melakukan Logout')</script>";
echo "<script>location='login.php';</script>";
 ?>