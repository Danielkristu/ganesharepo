# DFD Level 2: Proses 1.0 (Autentikasi & Verifikasi)

Dokumen ini memecah proses utama **1.0 Autentikasi & Verifikasi** menjadi langkah-langkah detail (sub-proses 1.1 sampai 1.4) untuk memodelkan pengiriman OTP, verifikasi kode, pengenalan profil otomatis lewat NIM, hingga pemberian izin masuk sistem.

---

## 1. Gambar DFD Level 2 (Proses 1.0)

```mermaid
flowchart TD
  %% Entitas Eksternal
  User[Mahasiswa / Admin]
  Email[Resend Email Service]

  %% Penyimpanan Data Internal
  DB_OTP[(Penyimpanan OTP Sementara)]
  DB_Profiles[(Basis Data Profil)]

  %% Sub-Proses di dalam Proses 1.0
  subgraph P1["Proses 1.0: Autentikasi & Verifikasi"]
    P11((1.1 <br> Pengiriman <br> Kode OTP))
    P12((1.2 <br> Verifikasi <br> Kode OTP))
    P13((1.3 <br> Pembacaan <br> NIM & Profil))
    P14((1.4 <br> Pemberian <br> Akses Masuk))
  end

  %% Aliran Data Sub-Proses 1.1
  User -->|Alamat Email Kampus| P11
  P11 -->|Kirim Kode OTP| Email
  P11 -->|Simpan Kode OTP| DB_OTP

  %% Aliran Data Sub-Proses 1.2
  User -->|Input Kode OTP| P12
  DB_OTP -->|Cocokkan Kode OTP| P12
  P12 -->|Konfirmasi Kode Cocok| P13

  %% Aliran Data Sub-Proses 1.3
  P13 -->|Deteksi Jurusan & Buat Profil| DB_Profiles

  %% Aliran Data Sub-Proses 1.4
  DB_Profiles -->|Data Profil & Status Akses| P14
  P14 -->|Akses Masuk & Profil Berhasil| User

  %% Penyelarasan Posisi Visual
  direction TB

  %% Kustomisasi Gaya Visual (Biru untuk Proses, Abu-Abu untuk Entitas/Database)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P11,P12,P13,P14 process
  class User,Email entity
  class DB_OTP,DB_Profiles datastore
```

---

## 2. Penjelasan Detil Aliran Data

* **Proses 1.1 (Pengiriman Kode OTP)**: Pengguna (Mahasiswa atau Admin) memasukkan alamat email resmi mereka. Sistem menghasilkan kode angka acak sekali pakai, mengirimkannya ke email tujuan lewat **Resend Email Service**, serta menyimpannya ke **Penyimpanan OTP Sementara**.
* **Proses 1.2 (Verifikasi Kode OTP)**: Pengguna memasukkan kode OTP yang mereka terima dari kotak masuk email. Sistem mengambil data dari **Penyimpanan OTP Sementara** untuk mencocokkan nilainya. Jika sesuai, sistem mengizinkan proses berlanjut.
* **Proses 1.3 (Pembacaan NIM & Profil)**: Begitu email terverifikasi, sistem membaca kode digit NIM pengguna. Karakter digit NIM tersebut digunakan untuk mengidentifikasi fakultas/jurusan secara otomatis dan menyimpannya di **Basis Data Profil** (jika baru pertama kali mendaftar).
* **Proses 1.4 (Pemberian Akses Masuk)**: Sistem membaca data profil yang telah tersimpan di **Basis Data Profil** untuk memeriksa apakah pengguna adalah Mahasiswa biasa atau Admin/Pengurus, lalu menyerahkan izin akses masuk agar pengguna dapat melihat halaman dashboard utama.
