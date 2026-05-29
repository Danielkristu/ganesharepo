# DFD Level 2: Proses 2.0 (Pencarian & Akses Dokumen)

Dokumen ini memecah proses utama **2.0 Pencarian & Akses Dokumen** menjadi bagian-bagian yang lebih detail (sub-proses 2.1 sampai 2.4) untuk menggambarkan bagaimana data mengalir antara mahasiswa, basis data internal, dan penyimpanan berkas cloud.

---

## 1. Gambar DFD Level 2 (Proses 2.0)

```mermaid
flowchart TD
  %% Entitas Eksternal
  Student[Mahasiswa / Pengguna]
  Storage[Cloudflare R2]

  %% Basis Data Internal (Penyimpanan Data)
  DB_Profiles[(Basis Data Profil)]
  DB_Docs[(Basis Data Dokumen)]
  DB_Logs[(Basis Data Aktivitas)]

  %% Sub-Proses di dalam Proses 2.0
  subgraph P2["Proses 2.0: Pencarian & Akses Dokumen"]
    P21((2.1 <br> Menerima Kata <br> Kunci Pencarian))
    P22((2.2 <br> Memvalidasi <br> Aturan Akses))
    P23((2.3 <br> Mengambil <br> Keterangan Dokumen))
    P24((2.4 <br> Membuka <br> Berkas Dokumen))
  end

  %% Aliran Data Sub-Proses 2.1
  Student -->|Kategori & Kata Kunci| P21
  P21 -->|Data Kueri Pencarian| P22

  %% Aliran Data Sub-Proses 2.2
  DB_Profiles -->|Informasi Jurusan & Status User| P22
  P22 -->|Daftar Dokumen Lolos Validasi| P23

  %% Aliran Data Sub-Proses 2.3
  DB_Docs -->|Data Penulis, Judul, & Detail| P23
  P23 -->|Data & Keterangan Dokumen| P24

  %% Aliran Data Sub-Proses 2.4
  P24 -->|Tampilan Berkas & Detail Dokumen| Student
  P24 -->|Permintaan Berkas Aman| Storage
  Storage -->|Aliran Berkas Dokumen| P24
  P24 -->|Catatan Riwayat Kunjungan| DB_Logs

  %% Penyelarasan Posisi Visual
  direction TB

  %% Kustomisasi Gaya Visual (Biru untuk Proses, Abu-Abu untuk Entitas/Database)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P21,P22,P23,P24 process
  class Student,Storage entity
  class DB_Profiles,DB_Docs,DB_Logs datastore
```

---

## 2. Penjelasan Detil Aliran Data

* **Proses 2.1 (Menerima Kata Kunci Pencarian)**: Mahasiswa memasukkan kategori dokumen, jurusan, atau kata kunci pencarian. Data pencarian ini diteruskan ke proses penyaringan selanjutnya.
* **Proses 2.2 (Memvalidasi Aturan Akses)**: Sistem mencocokkan asal jurusan atau tingkat akses mahasiswa (diambil dari **Basis Data Profil**) dengan aturan privasi dokumen. Hanya dokumen yang diperbolehkan untuk jurusan mahasiswa tersebut yang akan diloloskan ke proses berikutnya.
* **Proses 2.3 (Mengambil Keterangan Dokumen)**: Mengambil data deskripsi lengkap dokumen (seperti nama penulis, tahun rilis, deskripsi singkat) dari **Basis Data Dokumen** untuk dipersiapkan ke tampilan layar.
* **Proses 2.4 (Membuka Berkas Dokumen)**: Ketika mahasiswa mengklik dokumen untuk membacanya, sistem meminta berkas PDF dari **Cloudflare R2** secara aman, menampilkannya ke layar mahasiswa, serta mencatat riwayat kunjungan mahasiswa tersebut ke **Basis Data Aktivitas** untuk kebutuhan statistik pengurus.
