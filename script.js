// =====================================================
// Jadwal Piket Kelas 10A
// Isi file ini:
//   1. Pengaturan dan data kelompok piket
//   2. Cek hari ini (siswa yang bukan jadwalnya dikunci)
//   3. Checklist tugas + upload foto bukti
//   4. Poin kelompok
// =====================================================


// ---------- 1. Pengaturan dan data ----------

// Pengaturan poin (boleh diubah angkanya)
var poinPerSiswa = 10;     // poin kelompok untuk setiap siswa yang sudah lapor
var poinBonus = 15;        // bonus kalau jumlah yang lapor sudah cukup
var batasBonus = 0.75;     // 0.75 artinya minimal 75% anggota kelompok

// PIN untuk tombol hapus data. Catatan: PIN ini bisa dilihat siapa saja
// yang membuka file script.js, jadi ini hanya pengaman ringan
var pinGuru = "20261111";

// Hanya untuk mencoba web ini. Kosongkan lagi ("") kalau sudah dipakai sungguhan.
// Contoh mencoba hari Senin:  var hariUji = "Senin";
// Tulis persis seperti ini: Senin / Selasa / Rabu / Kamis / Jumat
var hariUji = "";

// Daftar kelompok piket. Kalau mau tambah siswa, tulis namanya di sini
// dan di tabel pada index.html
var jadwal = {
    Senin:  ["Kesia", "Diva", "Suci", "Snya", "Haidar", "Regl", "Arvino", "Iman"],
    Selasa: ["Tiara", "Fathimah", "Aura", "Alni", "Dzakwar", "Affan", "Reza"],
    Rabu:   ["Rindu", "Reina", "Salwah", "Ismi", "Marcello", "Rendy", "Daffa"],
    Kamis:  ["Meisya", "Salsa", "Sri", "Madina", "Risang", "Fabian", "Alif"],
    Jumat:  ["Yerika", "Melody", "Gita", "Jessica", "Yosafat", "Marcello E", "Oswald"]
};

var daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

// Nama hari sesuai urutan JavaScript (0 = Minggu)
var namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Tugas piket yang bisa dicentang
var tugasPiket = [
    "Menyapu seluruh lantai kelas",
    "Menghapus dan membersihkan papan tulis",
    "Merapikan meja guru",
    "Membuang sampah ke tempat pembuangan",
    "Merapikan meja dan kursi"
];

var namaPenyimpanan = "piket10a_data";

// Semua laporan disimpan di sini. Poin tidak disimpan,
// tapi dihitung ulang dari laporan setiap kali halaman dibuka
var dataPiket = {
    laporan: {}
};

var fotoBaru = "";    // foto yang baru dipilih siswa (disimpan sementara di sini)


// ---------- Ambil elemen dari HTML ----------
var teksHari = document.getElementById("teksHari");
var teksTanggal = document.getElementById("teksTanggal");
var btnReset = document.getElementById("btnReset");

var pilihNama = document.getElementById("pilihNama");
var peringatan = document.getElementById("peringatan");
var sudahLapor = document.getElementById("sudahLapor");
var formLapor = document.getElementById("formLapor");
var daftarTugas = document.getElementById("daftarTugas");
var inputFoto = document.getElementById("inputFoto");
var previewFoto = document.getElementById("previewFoto");
var pesanForm = document.getElementById("pesanForm");

var teksProgress = document.getElementById("teksProgress");
var isiProgress = document.getElementById("isiProgress");
var infoBonus = document.getElementById("infoBonus");
var pesanPoin = document.getElementById("pesanPoin");
var daftarStatus = document.getElementById("daftarStatus");
var galeri = document.getElementById("galeri");
var aturanPoin = document.getElementById("aturanPoin");
var isiPoin = document.getElementById("isiPoin");


// ---------- 2. Fungsi bantu ----------

// Hari piket yang sedang aktif, diambil otomatis dari tanggal di perangkat.
// Siswa tidak bisa memilih hari sendiri.
function ambilHariIni() {
    if (hariUji !== "") {
        return hariUji;
    }
    var nomor = new Date().getDay();
    return namaHari[nomor];
}

// Tanggal hari ini dalam bentuk 2026-11-01
function ambilTanggal() {
    var d = new Date();
    var bulan = d.getMonth() + 1;
    var tanggal = d.getDate();
    if (bulan < 10) { bulan = "0" + bulan; }
    if (tanggal < 10) { tanggal = "0" + tanggal; }
    return d.getFullYear() + "-" + bulan + "-" + tanggal;
}

// Kunci untuk membedakan data tiap hari, misalnya "2026-11-02_Senin"
function ambilKunci() {
    return ambilTanggal() + "_" + ambilHariIni();
}

// Mencari siswa itu masuk kelompok hari apa
function cariKelompok(nama) {
    for (var i = 0; i < daftarHari.length; i++) {
        var hari = daftarHari[i];
        if (jadwal[hari].indexOf(nama) !== -1) {
            return hari;
        }
    }
    return null;
}

function ambilJam() {
    return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// Jumlah siswa minimal yang harus lapor supaya kelompok dapat bonus.
// Contoh: 8 siswa x 75% = 6 siswa
function hitungBatasBonus(hari) {
    return Math.ceil(jadwal[hari].length * batasBonus);
}

// Menghitung total poin satu kelompok dari semua laporan yang tersimpan
function hitungPoinKelompok(hari) {
    var total = 0;

    for (var kunci in dataPiket.laporan) {
        // kunci berbentuk "2026-11-02_Senin", kita ambil bagian hari-nya
        var hariLaporan = kunci.split("_")[1];

        if (hariLaporan === hari) {
            var jumlahLapor = Object.keys(dataPiket.laporan[kunci]).length;

            total = total + (jumlahLapor * poinPerSiswa);

            if (jumlahLapor >= hitungBatasBonus(hari)) {
                total = total + poinBonus;
            }
        }
    }
    return total;
}


// ---------- Simpan dan muat data ----------

function muatData() {
    try {
        var tersimpan = localStorage.getItem(namaPenyimpanan);
        if (tersimpan) {
            dataPiket = JSON.parse(tersimpan);
        }
    } catch (e) {
        // kalau gagal dibaca, pakai data kosong saja
    }

    if (!dataPiket.laporan) {
        dataPiket.laporan = {};
    }
}

// Mengembalikan true kalau berhasil, false kalau penyimpanan penuh
function simpanData() {
    try {
        localStorage.setItem(namaPenyimpanan, JSON.stringify(dataPiket));
        return true;
    } catch (e) {
        return false;
    }
}


// ---------- 3. Menampilkan halaman ----------

// Isi pilihan nama (dikelompokkan per hari)
function isiPilihanNama() {
    var html = '<option value="">-- pilih nama --</option>';
    for (var i = 0; i < daftarHari.length; i++) {
        var hari = daftarHari[i];
        html += '<optgroup label="Kelompok ' + hari + '">';
        for (var j = 0; j < jadwal[hari].length; j++) {
            var nama = jadwal[hari][j];
            html += '<option value="' + nama + '">' + nama + '</option>';
        }
        html += '</optgroup>';
    }
    pilihNama.innerHTML = html;
}

// Tulisan hari dan tanggal di bagian atas
function tampilkanHariIni() {
    var hari = ambilHariIni();
    teksHari.textContent = hari;
    teksTanggal.textContent = new Date().toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
    });

    // beri warna pada kolom hari yang sedang piket di tabel jadwal
    var baris = document.querySelectorAll("#tabelJadwal tr");
    var urutan = daftarHari.indexOf(hari);
    for (var r = 0; r < baris.length; r++) {
        var sel = baris[r].children;
        for (var c = 0; c < sel.length; c++) {
            if (c === urutan) {
                sel[c].classList.add("hari-aktif");
            } else {
                sel[c].classList.remove("hari-aktif");
            }
        }
    }
}

// Menentukan apa yang muncul di bagian "Lapor Piket"
function perbaruiFormLapor() {
    var nama = pilihNama.value;
    var hari = ambilHariIni();

    // sembunyikan semuanya dulu
    peringatan.hidden = true;
    sudahLapor.hidden = true;
    formLapor.hidden = true;

    if (nama === "") {
        return;
    }

    // Kalau bukan jadwal piket siswa ini, tampilkan peringatan dan form tidak muncul
    if (cariKelompok(nama) !== hari) {
        peringatan.textContent = "⚠️ Jadwal piket anda bukan hari " + hari +
            ", kembali lagi sesuai jadwal piket yang telah ditentukan.";
        peringatan.hidden = false;
        return;
    }

    // Kalau sudah pernah lapor hari ini
    var laporanHariIni = dataPiket.laporan[ambilKunci()];
    if (laporanHariIni && laporanHariIni[nama]) {
        var data = laporanHariIni[nama];
        sudahLapor.textContent = "✅ " + nama + " sudah mengirim laporan piket hari ini (jam " +
            data.waktu + "). Tugas: " + data.tugas.join(", ") + ".";
        sudahLapor.hidden = false;
        return;
    }

    // Selain itu, tampilkan form untuk diisi
    buatDaftarTugas();
    formLapor.hidden = false;
}

// Membuat kotak centang untuk setiap tugas
function buatDaftarTugas() {
    var html = "";
    for (var i = 0; i < tugasPiket.length; i++) {
        html += '<li><input type="checkbox" id="tugas' + i + '">' +
                '<label for="tugas' + i + '">' + tugasPiket[i] + '</label></li>';
    }
    daftarTugas.innerHTML = html;

    // kosongkan foto dan pesan lama
    inputFoto.value = "";
    fotoBaru = "";
    previewFoto.hidden = true;
    pesanForm.hidden = true;
}

// Status anggota kelompok hari ini + bar progress
function tampilkanStatus() {
    var hari = ambilHariIni();
    var anggota = jadwal[hari];

    // Sabtu / Minggu tidak ada jadwal piket
    if (!anggota) {
        teksProgress.textContent = "Hari ini (" + hari + ") tidak ada jadwal piket.";
        isiProgress.style.width = "0%";
        infoBonus.textContent = "";
        daftarStatus.innerHTML = "";
        pesanPoin.hidden = true;
        return;
    }

    var laporanHariIni = dataPiket.laporan[ambilKunci()] || {};
    var sudah = 0;
    var html = "";

    for (var i = 0; i < anggota.length; i++) {
        var nama = anggota[i];
        if (laporanHariIni[nama]) {
            sudah++;
            html += '<li class="selesai">✅ ' + nama + ' <small>sudah lapor (jam ' +
                    laporanHariIni[nama].waktu + ')</small></li>';
        } else {
            html += '<li>⏳ ' + nama + ' <small>belum lapor</small></li>';
        }
    }
    daftarStatus.innerHTML = html;

    teksProgress.textContent = "Kelompok " + hari + ": " + sudah + " dari " + anggota.length + " siswa sudah lapor";
    isiProgress.style.width = (sudah / anggota.length * 100) + "%";

    // Info bonus dan poin yang sudah didapat hari ini
    var batas = hitungBatasBonus(hari);
    infoBonus.textContent = "Bonus " + poinBonus + " poin kalau minimal " + batas +
        " dari " + anggota.length + " siswa sudah lapor.";

    var poinHariIni = sudah * poinPerSiswa;

    if (sudah >= batas) {
        poinHariIni = poinHariIni + poinBonus;
        pesanPoin.textContent = "🎉 Kelompok " + hari + " sudah mencapai batas bonus! " +
            "Poin hari ini: " + poinHariIni + " (" + (sudah * poinPerSiswa) + " dari siswa + " + poinBonus + " bonus).";
        pesanPoin.hidden = false;
    } else if (sudah > 0) {
        pesanPoin.textContent = "Poin kelompok " + hari + " hari ini: " + poinHariIni +
            ". Kurang " + (batas - sudah) + " siswa lagi untuk dapat bonus " + poinBonus + " poin.";
        pesanPoin.hidden = false;
    } else {
        pesanPoin.hidden = true;
    }
}

// Foto bukti hari ini
function tampilkanGaleri() {
    var hari = ambilHariIni();
    var anggota = jadwal[hari];
    var laporanHariIni = dataPiket.laporan[ambilKunci()] || {};
    var html = "";

    if (anggota) {
        for (var i = 0; i < anggota.length; i++) {
            var data = laporanHariIni[anggota[i]];
            if (data) {
                html += '<figure>' +
                        '<img src="' + data.foto + '" alt="Foto bukti piket ' + anggota[i] + '">' +
                        '<figcaption><strong>' + anggota[i] + '</strong><br>' +
                        '<small>' + data.tugas.join(", ") + '</small></figcaption>' +
                        '</figure>';
            }
        }
    }

    if (html === "") {
        html = '<p class="petunjuk">Belum ada foto bukti hari ini.</p>';
    }
    galeri.innerHTML = html;
}

// Tabel poin semua kelompok
function tampilkanPoin() {
    var hari = ambilHariIni();

    aturanPoin.textContent = "Setiap siswa yang melapor dan mengupload foto bukti menambah " + poinPerSiswa +
        " poin untuk kelompoknya. Kalau minimal " + Math.round(batasBonus * 100) +
        "% anggota kelompok sudah melapor, kelompok mendapat bonus " + poinBonus +
        " poin. Jadi kalau ada teman yang sakit, kelompok tetap bisa dapat poin.";

    var html = "";
    for (var i = 0; i < daftarHari.length; i++) {
        var h = daftarHari[i];
        var kelas = (h === hari) ? ' class="hari-aktif"' : "";
        html += '<tr><td' + kelas + '>Kelompok ' + h + '</td><td' + kelas + '>' +
                hitungPoinKelompok(h) + ' poin</td></tr>';
    }
    isiPoin.innerHTML = html;
}

// Panggil semua fungsi tampilan sekaligus
function perbaruiSemua() {
    tampilkanHariIni();
    perbaruiFormLapor();
    tampilkanStatus();
    tampilkanGaleri();
    tampilkanPoin();
}


// ---------- 4. Upload foto ----------

// Foto dari HP biasanya besar sekali, jadi dikecilkan dulu
// supaya muat disimpan di browser
inputFoto.addEventListener("change", function () {
    var file = inputFoto.files[0];

    if (!file) {
        fotoBaru = "";
        previewFoto.hidden = true;
        return;
    }

    if (file.type.indexOf("image") !== 0) {
        tampilkanPesanForm("File yang dipilih harus berupa gambar.");
        inputFoto.value = "";
        return;
    }

    var pembaca = new FileReader();
    pembaca.onload = function (e) {
        var gambar = new Image();

        gambar.onload = function () {
            var lebarMaks = 700;
            var skala = Math.min(1, lebarMaks / gambar.width);

            var kanvas = document.createElement("canvas");
            kanvas.width = gambar.width * skala;
            kanvas.height = gambar.height * skala;
            kanvas.getContext("2d").drawImage(gambar, 0, 0, kanvas.width, kanvas.height);

            fotoBaru = kanvas.toDataURL("image/jpeg", 0.6);
            previewFoto.src = fotoBaru;
            previewFoto.hidden = false;
            pesanForm.hidden = true;
        };

        gambar.onerror = function () {
            tampilkanPesanForm("Foto tidak bisa dibuka, coba foto yang lain.");
        };

        gambar.src = e.target.result;
    };
    pembaca.readAsDataURL(file);
});

function tampilkanPesanForm(teks) {
    pesanForm.textContent = "❗ " + teks;
    pesanForm.hidden = false;
}


// ---------- Kirim laporan ----------

formLapor.addEventListener("submit", function (e) {
    e.preventDefault();   // supaya halaman tidak ter-refresh

    var nama = pilihNama.value;
    var hari = ambilHariIni();

    // Cek sekali lagi, jangan sampai siswa lain bisa lolos
    if (cariKelompok(nama) !== hari) {
        perbaruiFormLapor();
        return;
    }

    // Kumpulkan tugas yang dicentang
    var tugasDipilih = [];
    for (var i = 0; i < tugasPiket.length; i++) {
        if (document.getElementById("tugas" + i).checked) {
            tugasDipilih.push(tugasPiket[i]);
        }
    }

    if (tugasDipilih.length === 0) {
        tampilkanPesanForm("Centang minimal satu tugas yang kamu kerjakan.");
        return;
    }

    if (fotoBaru === "") {
        tampilkanPesanForm("Upload foto bukti piket dulu ya.");
        return;
    }

    // Simpan laporan
    var kunci = ambilKunci();
    if (!dataPiket.laporan[kunci]) {
        dataPiket.laporan[kunci] = {};
    }
    dataPiket.laporan[kunci][nama] = {
        tugas: tugasDipilih,
        foto: fotoBaru,
        waktu: ambilJam()
    };

    if (!simpanData()) {
        // penyimpanan browser penuh, batalkan laporan ini
        delete dataPiket.laporan[kunci][nama];
        tampilkanPesanForm("Gagal menyimpan, penyimpanan browser penuh. Hubungi guru.");
        return;
    }

    perbaruiSemua();
});


// ---------- Tombol dan pilihan ----------

pilihNama.addEventListener("change", perbaruiSemua);

// Tombol hapus data khusus guru (perlu PIN)
btnReset.addEventListener("click", function () {
    var pin = prompt("Masukkan PIN guru:");

    if (pin === null) {
        return;   // dibatalkan
    }
    if (pin !== pinGuru) {
        alert("PIN salah.");
        return;
    }
    if (confirm("Hapus semua laporan, foto, dan poin? Data tidak bisa dikembalikan.")) {
        localStorage.removeItem(namaPenyimpanan);
        dataPiket = { laporan: {} };
        perbaruiSemua();
    }
});


// ---------- Mulai ----------
muatData();
isiPilihanNama();
perbaruiSemua();