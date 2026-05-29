# DFD Process 5.0: Webinars & Analytics

A simplified DFD showing how webinars are scheduled and visitor access charts are generated.

---

## 1. Process 5.0 Diagram

```mermaid
flowchart LR
  %% Data Stores & Entities
  Admin[Admin / Coordinator]
  D1[D1 Webinar Rooms Database]
  D2[D2 Access Logs Database]

  %% Processes
  P51((5.1 Schedule <br> Webinar Slots))
  P52((5.2 Compile <br> Analytics Charts))

  %% Flows
  Admin -->|Webinar Schedule Details| P51
  P51 -->|Write Schedule| D1
  P51 -->|Setup Confirmation| Admin

  D2 -->|Raw Visitor Logs| P52
  P52 -->|Rendered Statistics| Admin

  %% Styling (Blue for Processes, Gray for Entities/Stores)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P51,P52 process
  class Admin entity
  class D1,D2 datastore
```

---

## 2. Key Data Flows

* **5.1 Schedule Webinar Slots**: Takes webinar title, timing, and meeting links from the coordinator and saves the schedule to **D1**.
* **5.2 Compile Analytics Charts**: Pulls access history from **D2** (views count, login frequency) to present visual charts and activity metrics to the admin.
