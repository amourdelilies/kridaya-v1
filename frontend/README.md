# KriDaya
Platform sponsor matching untuk event mahasiswa. Statis, tanpa build step.
Jalankan: buka `index.html`, atau `python3 -m http.server` lalu buka http://localhost:8000
- `index.html` landing page · `app.html` aplikasi (hash routing) · `js/app.js` logika dan view · `js/data.js` data contoh
- Data tersimpan di localStorage (mock). OTP demo: 123456. Tombol "Simulasikan" menggantikan aksi pihak lain/admin.
- Free: 3x matching, 5 kandidat. Premium (demo): 20 kandidat, tanpa batas.
- Langkah berikutnya: backend (auth OTP, DB, storage file, TTE), ganti fungsi `save()` dengan API call.
