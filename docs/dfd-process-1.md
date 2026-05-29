# DFD Process 1.0: Authentication & Verification

A simplified DFD showing the core OTP dispatch and verification flows.

---

## 1. Process 1.0 Diagram

```mermaid
flowchart LR
  %% Data Stores & Entities
  User[Student / Admin]
  D1[D1 Temporary OTP Store]
  Email[Resend Email Service]
  D2[D2 Profiles Database]

  %% Processes
  P11((1.1 Dispatch <br> OTP Code))
  P12((1.2 Verify <br> OTP Code))

  %% Flows
  User -->|University Email| P11
  P11 -->|Store Code| D1
  P11 -->|Send Email| Email

  User -->|Input OTP Code| P12
  D1 -->|Active Code| P12
  P12 -->|Access Grant & Profile| D2
  D2 -->|Session Ready| User

  %% Styling (Blue for Processes, Gray for Entities/Stores)
  classDef process fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
  classDef entity fill:#cbd5e1,stroke:#475569,stroke-width:2px,color:#0f172a
  classDef datastore fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
  
  class P11,P12 process
  class User,Email entity
  class D1,D2 datastore
```

---

## 2. Key Data Flows

* **1.1 Dispatch OTP Code**: Takes the user's email, writes a temporary code to **D1**, and triggers **Resend** to send the email.
* **1.2 Verify OTP Code**: Verifies the input code against **D1**, updates the student session status in **D2**, and grants dashboard access back to the user.
