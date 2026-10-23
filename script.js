/* =========================================
   FATHONA FESTIVAL 2026 - SCRIPT.JS
========================================= */

// URL Web App dari Google Apps Script kamu
const API_URL = "https://script.google.com/macros/s/AKfycbys1svBzANd8tn3bSn51439C3gA1zSQMM7dCkLf1XI8_eaRERXaRrEitQxfWcL2XWqnlg/exec"; 
const TOKEN_ADMIN = 'olimpiade-2026-x9k2m';

/* ⚠️ UBAH DURASI UJIAN DI SINI (Dalam Satuan Menit) */
const DURASI_UJIAN_MENIT = 60; 

let pesertaData = null;
let soalData = [];
let jawabanSiswa = {};
let currentIndex = 0;
let timerInterval;
let startTime = 0;

/* ================= NAVIGASI HALAMAN ================= */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

/* Tampilkan info durasi di halaman login saat pertama dibuka */
document.addEventListener('DOMContentLoaded', () => {
  const infoDurasi = document.getElementById('infoDurasi');
  const timerDisplay = document.getElementById('timerDisplay');
  
  if (infoDurasi) infoDurasi.innerText = DURASI_UJIAN_MENIT;
  if (timerDisplay) timerDisplay.innerText = `${DURASI_UJIAN_MENIT}:00`;
});

/* ================= 1. LOGIN PESERTA ================= */
async function loginPeserta() {
  const nama = document.getElementById('loginNama').value.trim();
  const sekolah = document.getElementById('loginSekolah').value.trim();
  const msg = document.getElementById('loginMsg');
  
  if (!nama || !sekolah) { 
    msg.innerText = "Nama dan Asal Sekolah wajib diisi!"; 
    return; 
  }
  
  msg.innerText = "Memeriksa data...";
  msg.style.color = "var(--text-muted)";

  try {
    const res = await fetch(`${API_URL}?action=login&nama=${encodeURIComponent(nama)}&sekolah=${encodeURIComponent(sekolah)}`);
    const data = await res.json();
    
    if (data.ok) {
      pesertaData = { nama: nama, sekolah: sekolah };
      msg.innerText = "";
      await startExam();
    } else {
      msg.innerText = data.error;
      msg.style.color = "var(--danger)";
    }
  } catch (err) {
    msg.innerText = "Gagal terhubung ke server. Periksa koneksi internet.";
    msg.style.color = "var(--danger)";
  }
}

/* ================= 2. MULAI UJIAN ================= */
async function startExam() {
  showScreen('examScreen');
  document.getElementById('pesertaNama').innerText = pesertaData.nama;
  
  try {
    const res = await fetch(`${API_URL}?action=get_soal`);
    const data = await res.json();
    
    if (data.ok) {
      soalData = data.data;
      renderSoal();
      
      // Catat waktu mulai untuk menghitung durasi
      startTime = Date.now(); 
      startTimer(DURASI_UJIAN_MENIT * 60); 
    } else {
      alert("Gagal memuat soal: " + data.error);
    }
  } catch (err) {
    alert("Gagal memuat soal. Silakan refresh halaman.");
  }
}

/* ================= 3. RENDER SOAL ================= */
function renderSoal() {
  const container = document.getElementById('soalContainer');
  const s = soalData[currentIndex];
  const total = soalData.length;
  
  // Update Progress
  document.getElementById('soalProgress').innerText = `Soal ${currentIndex + 1} dari ${total}`;
  const progressPercent = ((currentIndex + 1) / total) * 100;
  document.getElementById('progressBar').style.width = `${progressPercent}%`;

  // Render HTML Soal & Pilihan
  container.innerHTML = `
    <div class="soal-text">${s.text}</div>
    
    <label class="opsi-label">
      <input type="radio" name="opsi" value="A" ${jawabanSiswa[s.no] === 'A' ? 'checked' : ''} onchange="simpanJawaban('A')"> 
      <span><b>A.</b> ${s.a}</span>
    </label>
    <label class="opsi-label">
      <input type="radio" name="opsi" value="B" ${jawabanSiswa[s.no] === 'B' ? 'checked' : ''} onchange="simpanJawaban('B')"> 
      <span><b>B.</b> ${s.b}</span>
    </label>
    <label class="opsi-label">
      <input type="radio" name="opsi" value="C" ${jawabanSiswa[s.no] === 'C' ? 'checked' : ''} onchange="simpanJawaban('C')"> 
      <span><b>C.</b> ${s.c}</span>
    </label>
    <label class="opsi-label">
      <input type="radio" name="opsi" value="D" ${jawabanSiswa[s.no] === 'D' ? 'checked' : ''} onchange="simpanJawaban('D')"> 
      <span><b>D.</b> ${s.d}</span>
    </label>
  `;

  // Atur tombol navigasi
  document.getElementById('btnPrev').disabled = (currentIndex === 0);
  
  const btnNext = document.getElementById('btnNext');
  if (currentIndex === total - 1) {
    btnNext.innerHTML = "Selesai & Kirim ✅";
  } else {
    btnNext.innerHTML = "Selanjutnya →";
  }
}

function simpanJawaban(jawaban) {
  jawabanSiswa[soalData[currentIndex].no] = jawaban;
}

function nextSoal() {
  if (currentIndex < soalData.length - 1) {
    currentIndex++;
    renderSoal();
  } else {
    if(confirm("Yakin ingin menyelesaikan ujian? Jawaban tidak bisa diubah lagi.")) {
      submitUjian();
    }
  }
}

function prevSoal() {
  if (currentIndex > 0) {
    currentIndex--;
    renderSoal();
  }
}

/* ================= 4. TIMER ================= */
function startTimer(duration) {
  let timer = duration, minutes, seconds;
  const display = document.getElementById('timerDisplay');
  
  timerInterval = setInterval(() => {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);
    
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    
    display.textContent = minutes + ":" + seconds;
    
    // Jika sisa waktu 5 menit (300 detik), ubah warna jadi merah
    if(timer <= 300) {
      display.style.color = "var(--danger)";
    }
    
    if (--timer < 0) {
      clearInterval(timerInterval);
      alert("Waktu habis! Jawaban Anda akan dikirim otomatis.");
      submitUjian();
    }
  }, 1000);
}

/* ================= 5. SUBMIT JAWABAN ================= */
async function submitUjian() {
  clearInterval(timerInterval);
  
  // Hitung total durasi pengerjaan (dalam detik)
  const endTime = Date.now();
  const durasiDetik = Math.floor((endTime - startTime) / 1000);
  
  // Pindah ke layar sukses
  showScreen('resultScreen');
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'submit',
        nama: pesertaData.nama,
        sekolah: pesertaData.sekolah,
        jawaban: jawabanSiswa,
        durasi: durasiDetik // Kirim durasi ke server
      })
    });
    
    const data = await res.json();
    
    if (!data.ok) {
      alert("Gagal menyimpan jawaban: " + data.error + "\n\nSilakan hubungi panitia.");
    }
    
  } catch (err) {
    alert("Gagal mengirim jawaban karena koneksi terputus. Silakan hubungi panitia.");
  }
}

/* ================= 6. FITUR ADMIN ================= */
document.getElementById('btnAdmin').addEventListener('click', () => {
  const pass = prompt("Masukkan Password Admin:");
  if (pass === "ulayya01") {
    showScreen('adminScreen');
    loadAdminData();
  } else if (pass !== null) {
    alert("Password salah! Akses ditolak.");
  }
});

async function loadAdminData() {
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = "<tr><td colspan='5' class='text-center'>Memuat data...</td></tr>";
  
  try {
    const res = await fetch(`${API_URL}?action=admin_data&token_admin=${TOKEN_ADMIN}`);
    const data = await res.json();
    
    if (data.ok) {
      if (data.data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' class='text-center'>Belum ada siswa yang menyelesaikan ujian.</td></tr>";
        return;
      }
      
      // LOGIKA SORTING: Skor Tertinggi -> Durasi Tercepat
      const sortedData = data.data.sort((a, b) => {
        if (b.skor !== a.skor) {
          return b.skor - a.skor; // Urutkan skor tertinggi
        }
        return a.durasi - b.durasi; // Jika skor sama, urutkan waktu tercepat
      });
      
      tbody.innerHTML = sortedData.map((r) => {
        // Warna skor: Hijau jika >= 70, Merah jika di bawah
        const skorColor = r.skor >= 70 ? 'var(--success)' : 'var(--danger)';
        
        // Format Durasi: Ubah detik menjadi "Xm Ys"
        const menit = Math.floor(r.durasi / 60);
        const detik = r.durasi % 60;
        const formatDurasi = `${menit}m ${detik}s`;
        
        return `
          <tr>
            <td>${r.waktu}</td>
            <td><b>${r.nama}</b></td>
            <td>${r.sekolah}</td>
            <td style="font-weight: 800; color: ${skorColor};">${r.skor}</td>
            <td>⏱️ ${formatDurasi}</td>
          </tr>
        `;
      }).join('');
      
    } else {
      tbody.innerHTML = `<tr><td colspan='5' class='text-center' style='color:var(--danger)'>Error: ${data.error}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = "<tr><td colspan='5' class='text-center' style='color:var(--danger)'>Gagal terhubung ke server.</td></tr>";
  }
}
