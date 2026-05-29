# Ganesha Repository Level 2 Data Flow Diagram

```mermaid
flowchart LR
  %% External entities
  Student[Student / User]
  Admin[Admin / Pengurus]
  Resend[Resend Email Service]
  R2[Cloudflare R2]

  %% Systems
  FE[Next.js Frontend]
  BE[FastAPI Backend]

  %% Data stores
  OTP[(OTP Store)]
  Profiles[(Supabase: profiles)]
  Documents[(Supabase: documents)]
  Webinars[(Supabase: webinar_rooms)]
  Analytics[(Supabase: analytics / logs)]

  %% 1.0 Authentication
  subgraph P1[1.0 Authentication & Session Issuance]
    P11[1.1 Send OTP]
    P12[1.2 Verify OTP]
    P13[1.3 Parse NIM & Seed Profile]
    P14[1.4 Issue JWT Session]
  end

  %% 2.0 Repository access
  subgraph P2[2.0 Repository Access & Document Retrieval]
    P21[2.1 Request Document List]
    P22[2.2 Apply Visibility Rules]
    P23[2.3 Fetch Document Metadata]
    P24[2.4 Open / View Document]
  end

  %% 3.0 Admin document management
  subgraph P3[3.0 Admin Document Management]
    P31[3.1 Create / Edit Document Metadata]
    P32[3.2 Generate Upload Presign URL]
    P33[3.3 Upload Material / Thumbnail]
    P34[3.4 Persist Document Record]
    P35[3.5 Delete Document]
  end

  %% 4.0 Admin members
  subgraph P4[4.0 Pengurus / Faculty Member Management]
    P41[4.1 List Faculty Members]
    P42[4.2 Promote / Demote Member]
    P43[4.3 Enforce Sole-Admin Rule]
  end

  %% 5.0 Webinar / analytics
  subgraph P5[5.0 Webinar & Analytics]
    P51[5.1 Create / Update Webinar]
    P52[5.2 Read Dashboard Metrics]
  end

  %% Authentication flows
  Student -->|email| FE
  Admin -->|email| FE
  FE -->|send-otp request| BE
  BE --> P11 --> Resend
  BE --> OTP
  OTP --> P12
  P12 --> P13
  P13 --> Profiles
  Profiles --> P14
  P14 -->|JWT + user profile| FE

  %% Repository flows
  Student -->|search / filter / view| FE
  FE -->|authorized request| BE
  BE --> P21 --> P22 --> P23 --> Documents
  Documents --> P24
  P24 -->|metadata + file URL| FE
  FE -->|view PDF / file| BE
  BE --> R2

  %% Admin document flows
  Admin -->|dashboard document form| FE
  FE -->|create/update/delete| BE
  BE --> P31 --> P32
  P32 --> R2
  P33 --> R2
  P34 --> Documents
  P35 --> Documents

  %% Admin member flows
  Admin -->|pengurus actions| FE
  FE -->|member management| BE
  BE --> P41 --> Profiles
  BE --> P42 --> P43 --> Profiles

  %% Webinar / analytics flows
  Admin -->|webinar management| FE
  FE -->|webinar API calls| BE
  BE --> P51 --> Webinars
  Admin -->|dashboard overview| FE
  FE -->|metrics request| BE
  BE --> P52 --> Analytics
```

## Notes

- The diagram reflects the current frontend and backend routing in this project.
- `documents` stores both file-backed and link-backed materials, while `material_type` determines how the viewer opens them.
- `profiles` is the source of truth for role, faculty, and major.
- `OTP Store` is in-memory in the current backend implementation.
- The dashboard and repository views are protected by frontend route guards plus backend authorization checks.
