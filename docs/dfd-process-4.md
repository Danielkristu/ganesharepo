# DFD Process 4.0: Member & Staff Management

A simplified DFD showing how member lists are loaded and roles are verified and updated.

---

## 1. Process 4.0 Diagram

```mermaid
flowchart LR
  %% Data Stores & Entities
  Admin[Admin / Coordinator]
  D1[D1 Profiles Database]

  %% Processes
  P41((4.1 Retrieve <br> Member Lists))
  P42((4.2 Update & <br> Verify Roles))

  %% Flows
  Admin -->|Request Roster| P41
  D1 -->|Profiles Data| P41
  P41 -->|Roster Display| Admin

  Admin -->|Role Action| P42
  P42 -->|Write New Role| D1
  P42 -->|Success / Safety Alerts| Admin

  %% Styling (Blue for Processes, Gray for Entities/Stores)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P41,P42 process
  class Admin entity
  class D1 datastore
```

---

## 2. Key Data Flows

* **4.1 Retrieve Member Lists**: Pulls names, registration times, and roles from **D1** to display the active list to the administrator.
* **4.2 Update & Verify Roles**: Changes a member's status (promoting or demoting) while making sure at least one active admin is always preserved in **D1**.
