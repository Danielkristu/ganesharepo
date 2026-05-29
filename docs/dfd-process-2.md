# DFD Process 2.0: Document Search & Access

A simplified DFD showing how documents are searched and securely rendered.

---

## 1. Process 2.0 Diagram

```mermaid
flowchart LR
  %% Data Stores & Entities
  Student[Student / User]
  D1[D1 Documents Database]
  D2[D2 Profiles Database]
  Storage[Cloudflare R2]

  %% Processes
  P21((2.1 Search & <br> Filter Materials))
  P22((2.2 Secure <br> Document Viewer))

  %% Flows
  Student -->|Search Queries| P21
  D1 -->|Document Metadata| P21
  P21 -->|Filtered Resource| P22

  D2 -->|Major & Role Info| P22
  Storage <-->|Retrieve File| P22
  P22 -->|Document PDF View| Student

  %% Styling (Blue for Processes, Gray for Entities/Stores)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P21,P22 process
  class Student,Storage entity
  class D1,D2 datastore
```

---

## 2. Key Data Flows

* **2.1 Search & Filter Materials**: Takes student search queries and displays matching metadata from **D1**.
* **2.2 Secure Document Viewer**: Compares the student's profile eligibility from **D2** (visibility rules) and fetches the physical PDF from **Cloudflare R2** to render inside the secure viewer.
