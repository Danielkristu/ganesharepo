# DFD Process 3.0: Document & File Management

A simplified DFD showing how documents are uploaded, processed, and persisted.

---

## 1. Process 3.0 Diagram

```mermaid
flowchart LR
  %% Data Stores & Entities
  Admin[Admin / Coordinator]
  Storage[Cloudflare R2]
  D1[D1 Documents Database]

  %% Processes
  P31((3.1 Upload <br> Material File))
  P32((3.2 Persist <br> Resource Metadata))

  %% Flows
  Admin -->|Document File| P31
  P31 -->|Save File| Storage
  P31 -->|Upload Status & URL| P32

  Admin -->|Metadata Form| P32
  P32 -->|Write Record| D1
  P32 -->|Success Confirmation| Admin

  %% Styling (Blue for Processes, Gray for Entities/Stores)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P31,P32 process
  class Admin,Storage entity
  class D1 datastore
```

---

## 2. Key Data Flows

* **3.1 Upload Material File**: Transfers raw PDF materials and thumbnails directly from the admin to **Cloudflare R2** and receives the final file location.
* **3.2 Persist Resource Metadata**: Saves the descriptive details (title, author, course) alongside the Cloudflare URL into **D1**, notifying the admin of a successful upload.
