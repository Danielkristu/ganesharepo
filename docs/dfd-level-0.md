# Data Flow Diagram Level 0 (DFD Level 0) - Simplified

A highly simplified DFD showing the Ganesha Repository system's 5 core processes organized in a Left-Center-Right layout.

---

## 1. Simplified DFD Level 0 Diagram

```mermaid
flowchart LR
  %% Left Entities (Users)
  Student[Student / User]
  Admin[Admin / Coordinator]

  %% Center Processes (System Functions)
  subgraph System["Ganesha Repository"]
    P1((1.0 Auth))
    P2((2.0 Search))
    P3((3.0 Files))
    P4((4.0 Members))
    P5((5.0 Webinars))
  end

  %% Right Entities (External Services)
  Resend[Resend Email]
  R2[Cloudflare R2]

  %% Flows for 1.0 (Auth)
  Student --> P1
  Admin --> P1
  P1 --> Resend

  %% Flows for 2.0 (Search & Access)
  Student --> P2
  P2 <--> R2

  %% Flows for 3.0 (File Management)
  Admin --> P3
  P3 --> R2

  %% Flows for 4.0 & 5.0 (Admin Actions)
  Admin --> P4
  Admin --> P5

  %% Visual Layout Alignment
  direction LR

  %% Style Customization
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  
  class P1,P2,P3,P4,P5 process
  class Student,Admin,Resend,R2 entity
```

---

## 2. Description of Connections

* **Student / User & Admin** connect to **1.0 Auth** to log in, which sends OTP requests to **Resend Email**.
* **Student / User** connects to **2.0 Search** to find and view materials fetched from **Cloudflare R2**.
* **Admin** connects to **3.0 Files** to upload materials directly to **Cloudflare R2**.
* **Admin** connects to **4.0 Members** to manage staff roles, and **5.0 Webinars** to schedule webinars and view logs.
