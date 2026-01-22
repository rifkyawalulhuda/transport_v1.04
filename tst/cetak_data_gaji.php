
<?php include 'header.php'; ?>
<body>
    <aside id="left-panel" class="left-panel">
        <nav class="navbar navbar-expand-sm navbar-default">

          <div class="navbar-header">
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#main-menu" aria-controls="main-menu" aria-expanded="false" aria-label="Toggle navigation">
                    <i class="fa fa-bars"></i>
                </button>

          </div>

           <?php include 'menu.php'; ?><!-- /.navbar-collapse -->
        </nav>
    </aside>
    <div id="right-panel" class="right-panel">
        <div class="breadcrumbs">
            <div class="col-sm-4">
                <div class="page-header float-left">
                    <div class="page-title">
                        <h1>Selamat Datang Keuangan</h1>
                    </div>
                </div>
            </div>
            <div class="col-sm-8">
                <div class="page-header float-right">
                    <div class="page-title">
                        <ol class="breadcrumb text-right">
                           
                        </ol>
                    </div>
                </div>
            </div>
        </div>
        <div class="content mt-3">
            <div class="card-header">
               <?php
                $Open = mysql_connect("localhost","root","");
                    if (!$Open){
                    die ("Koneksi ke Engine MySQL Gagal !");
                    }
                $Koneksi = mysql_select_db("penggajian");
                    if (!$Koneksi){
                    die ("Koneksi ke Database Gagal !");
                    }
            ?>
                             <form action="cetak_data_gaji.php" method="post" name="postform">
                <p align="center"><font color="black" size="3"><b>Pencarian Data Berdasarkan Periode Tanggal</b></font></p><br />
                <table border="0">
                    <tr>
                        <td width="125"><b>Dari Tanggal</b></td>
                        <td colspan="2" width="190">: <input type="date" name="tanggal_awal" size="16" />
                        <a href="javascript:void(0)" onClick="if(self.gfPop)gfPop.fPopCalendar(document.postform.tanggal_awal);return false;" ></a>                
                        </td>
                        <td width="125"><b>Sampai Tanggal</b></td>
                        <td colspan="2" width="190">: <input type="date" name="tanggal_akhir" size="16" />
                        <a href="javascript:void(0)" onClick="if(self.gfPop)gfPop.fPopCalendar(document.postform.tanggal_akhir);return false;" ></a>                
                        </td>
                        <td colspan="2" width="190"><input type="submit" value="Pencarian Data" class="btn btn-info" name="pencarian"/></td>
                    </tr>
                </table>
            </form><br />
            <p>
            <?php
                //proses jika sudah klik tombol pencarian data
                if(isset($_POST['pencarian'])){
                //menangkap nilai form
                $tanggal_awal=$_POST['tanggal_awal'];
                $tanggal_akhir=$_POST['tanggal_akhir'];
                if(empty($tanggal_awal) || empty($tanggal_akhir)){
                //jika data tanggal kosong
                ?>
                <script language="JavaScript">
                    alert('Tanggal Awal dan Tanggal Akhir Harap di Isi!');
                    document.location='cetak_data_gaji.php';
                </script>
                <?php
                }else{
                ?><i><b>Informasi : </b> Hasil pencarian data berdasarkan periode Tanggal <b><?php echo $_POST['tanggal_awal']?></b> s/d <b><?php echo $_POST['tanggal_akhir']?></b></i>
                <?php
                $query=mysql_query("select * from proses_gaji
                    JOIN karyawan ON proses_gaji.id_karyawan = karyawan.id_karyawan
                 where tanggal between '$tanggal_awal' and '$tanggal_akhir'");
                }
            ?>
            </p>
            <table id="bootstrap-data-table" class="table table-striped table-bordered">
                <tr bgcolor="#FF6600">
                    <th width="60" height="40%">Nama Karyawan</td> 
                    <th width="70">Gaji Pokok</td> 
                    <th width="60">Potongan</td> 
                    <th width="60">Gaji Bersih</td> 
                    <th width="100">Tanggal</td>       
                </tr>
                <?php
                //menampilkan pencarian data
                while($row=mysql_fetch_array($query)){
                ?>
                <tr>
                    <td align=""><?php echo $row['nama_karyawan']; ?></td>
                    <td align="">Rp. <?php echo number_format($row['gaji']);?></td>
                    <td align="">Rp. <?php echo number_format( $row['potongan']);?></td>
                    <td align="">Rp. <?php echo number_format( $row['gaji_bersih']);?></td>
                    <td align=""><?php echo date('d F Y', strtotime($row['tanggal'])); ?></td>
                </tr>
                <?php
                }
                ?>    
                <tr>
                    <td colspan="4" align="center"> 
                    <?php
                    //jika pencarian data tidak ditemukan
                    if(mysql_num_rows($query)==0){
                        echo "<font color=red><blink>Pencarian data tidak ditemukan!</blink></font>";
                    }
                    ?>
                    </td>
                </tr> 
            </table>
            <?php
            }
            else{
                unset($_POST['pencarian']);
            }
            ?>
            <iframe width=174 height=189 name="gToday:normal:calender/normal.js" id="gToday:normal:calender/normal.js" src="calender/ipopeng.htm" scrolling="no" frameborder="0" style="visibility:visible; z-index:999; position:absolute; top:-500px; left:-500px;"></iframe>
</div>
                        
                  
       
<?php include 'footer.php'; ?>
      
