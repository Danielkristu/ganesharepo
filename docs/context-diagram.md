# System Context Diagram (Context Level DFD) - Ganesha Repository

The Context Diagram represents the entire **Ganesha Repository System** as a single process, showing the boundaries of the system and its interactions with external entities.

---

## 1. Context Diagram (Blue / White Style)

```mermaid
flowchart TD
  %% Central Process (Single System Bubble)
  System(((0.0 Ganesha Repository <br> System)))

  %% External Entities
  Student[Student / User]
  Admin[Admin / Coordinator]
  Email[Resend Email Service]
  Storage[Cloudflare R2]

  %% Data flows for Student
  Student -->|Search Queries & OTP Verify| System
  System -->|Document Lists & File Stream| Student

  %% Data flows for Admin
  Admin -->|Document Uploads & Roster Updates| System
  System -->|Analytics Charts & Roster Displays| Admin

  %% Data flows for Resend Email Service
  System -->|Kirim Kode OTP| Email

  %% Data flows for Cloudflare R2 Storage
  System <-->|Simpan / Ambil Berkas Dokumen| Storage

  %% Style Customization (Clean Blue & White Theme)
  classDef systemProcess fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef externalEntity fill:#ffffff,stroke:#475569,stroke-width:2px,color:#0f172a
  
  class System systemProcess
  class Student,Admin,Email,Storage externalEntity
```

---

## 2. Entity Descriptions

* **Student / User**: Queries documents, requests and verifies OTP codes to log in, and views PDF resources.
* **Admin / Coordinator**: Uploads materials, manages team permissions, creates webinars, and requests visitor analytics.
* **Resend Email Service**: An external API that sends OTP authentication emails.
* **Cloudflare R2**: An S3-compatible cloud object store where PDF documents and thumbnail files are hosted.
