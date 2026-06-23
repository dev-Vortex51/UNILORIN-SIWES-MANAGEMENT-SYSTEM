# IITMS — ERD & System Flowchart

> The ERD is split into domain-specific diagrams for easy screenshotting.

---

## Diagram 1 — Organization Structure (Faculty / Department / Users)

```mermaid
erDiagram
    Faculty ||--o{ Department : has
    Faculty ||--o{ User : has
    Department }o--|| Faculty : belongs_to
    Department ||--o{ User : has
    Department }o--o{ User : coordinated_by
    User ||--o| NotificationPreference : has

    Faculty {
        string id PK
        string name
        string code
        bool isActive
    }

    Department {
        string id PK
        string name
        string code
        string facultyId FK
        bool isActive
    }

    User {
        string id PK
        string email
        string firstName
        string lastName
        string role
        string departmentId FK
        string facultyId FK
        bool isActive
    }

    NotificationPreference {
        string id PK
        string userId FK
        bool emailNotifications
    }

    SystemSettings {
        string id PK
        string currentSession
        int logbookWeight
        int assessmentWeight
    }
```

---

## Diagram 2 — Student & Placement

```mermaid
erDiagram
    Department ||--o{ Student : has
    User ||--o| Student : has_profile
    Student ||--o{ Placement : submits
    Student ||--o{ SupervisorAssignment : assigned_to
    IndustryPartner ||--o{ Placement : hosts
    Placement ||--o{ SupervisorAssignment : associates

    Student {
        string id PK
        string userId FK
        string matricNumber
        string departmentId FK
        int level
        string session
        float cgpa
        bool hasPlacement
        bool placementApproved
    }

    Placement {
        string id PK
        string studentId FK
        string companyName
        string companyAddress
        string companyEmail
        string companyPhone
        string position
        date startDate
        date endDate
        string status
        string industryPartnerId FK
        string industrialSupervisorId FK
    }

    IndustryPartner {
        string id PK
        string name
        string email
        string phone
        string sector
    }

    SupervisorAssignment {
        string id PK
        string studentId FK
        string supervisorId FK
        string placementId FK
        string status
    }
```

---

## Diagram 3 — Supervisor & Assessments

```mermaid
erDiagram
    User ||--o| Supervisor : has_profile
    Department ||--o{ Supervisor : has
    IndustryPartner ||--o{ Supervisor : employs
    Supervisor ||--o{ Assessment : conducts
    Supervisor ||--o{ Visit : performs
    Supervisor ||--o{ Placement : supervises
    Visit ||--o{ Assessment : triggers
    Student ||--o{ Assessment : receives
    Student ||--o{ Visit : receives

    Supervisor {
        string id PK
        string userId FK
        string type
        string departmentId FK
        string companyName
        string industryPartnerId FK
        int maxStudents
        bool isAvailable
    }

    Assessment {
        string id PK
        string studentId FK
        string supervisorId FK
        string placementId FK
        string visitId FK
        string type
        int technical
        int communication
        int punctuality
        int initiative
        int teamwork
        string recommendation
        string grade
        string status
    }

    Visit {
        string id PK
        string studentId FK
        string supervisorId FK
        string placementId FK
        datetime visitDate
        string type
        string status
        string feedback
        int score
    }
```

---

## Diagram 4 — Logbook & Reviews

```mermaid
erDiagram
    Student ||--o{ Logbook : writes
    Logbook ||--o{ LogbookEvidence : has
    Logbook ||--o{ LogbookReview : reviewed_by
    Supervisor ||--o{ LogbookReview : reviews

    Logbook {
        string id PK
        string studentId FK
        int weekNumber
        date startDate
        date endDate
        string tasksPerformed
        string skillsAcquired
        string challenges
        string status
        string departmentalReviewStatus
        string industrialReviewStatus
    }

    LogbookEvidence {
        string id PK
        string logbookId FK
        string name
        string path
        string type
    }

    LogbookReview {
        string id PK
        string logbookId FK
        string supervisorId FK
        string supervisorType
        string comment
        float rating
        string status
    }
```

---

## Diagram 5 — Attendance

```mermaid
erDiagram
    Student ||--o{ Attendance : records
    Placement ||--o{ Attendance : tracks
    Supervisor ||--o{ Attendance : approves

    Attendance {
        string id PK
        string studentId FK
        string placementId FK
        date date
        datetime checkInTime
        datetime checkOutTime
        float hoursWorked
        string punctuality
        string dayStatus
        string approvalStatus
        string absenceReason
        string supervisorId FK
    }
```

---

## Diagram 6 — Compliance & Reports

```mermaid
erDiagram
    Student ||--o{ ComplianceForm : uploads
    Student ||--o{ TechnicalReport : submits
    Placement ||--o{ ComplianceForm : requires
    Placement ||--o{ TechnicalReport : generates
    User ||--o{ ComplianceForm : reviews
    User ||--o{ TechnicalReport : reviews

    ComplianceForm {
        string id PK
        string studentId FK
        string placementId FK
        string formType
        string title
        string status
        string documentName
        string reviewedById FK
    }

    TechnicalReport {
        string id PK
        string studentId FK
        string placementId FK
        string title
        string abstract
        string status
        string documentName
        string reviewedById FK
    }
```

---

## Diagram 7 — Notifications & Invitations

```mermaid
erDiagram
    User ||--o{ Notification : receives
    User ||--o{ Invitation : sends
    Notification ||--|{ User : created_by

    Notification {
        string id PK
        string recipientId FK
        string type
        string title
        string message
        string priority
        bool isRead
    }

    Invitation {
        string id PK
        string email
        string role
        string token
        datetime expiresAt
        string status
        string invitedById FK
        string departmentId FK
    }
```

---

---

## System Flowcharts

> Split by role/domain for easy screenshotting.

---

### Flowchart 1 — Authentication & Onboarding

```mermaid
flowchart TD
    START([User arrives]) --> LOGIN{Has an account?}
    LOGIN -->|No - Invited| INVITE_VERIFY[Verify Invite]
    INVITE_VERIFY --> INVITE_SETUP[Setup Account]
    INVITE_SETUP --> LOGIN_PAGE[Login Page]
    LOGIN -->|No - Not Invited| FORGOT_PWD[Forgot Password]
    FORGOT_PWD --> LOGIN_PAGE
    LOGIN -->|Yes| LOGIN_PAGE
    LOGIN_PAGE --> AUTH{Valid credentials?}
    AUTH -->|No| LOGIN_PAGE
    AUTH -->|Yes| CHECK_PWD{Password reset<br/>required?}
    CHECK_PWD -->|Yes| RESET_PWD[Reset Password]
    RESET_PWD --> LOGIN_PAGE
    CHECK_PWD -->|No| ROLE_GATE[[Redirect by Role]]
```

---

### Flowchart 2 — Admin

```mermaid
flowchart TD
    ADMIN([Admin Login]) --> ADM_DASH[Admin Dashboard]
    ADM_DASH --> ADM_FAC[Manage Faculties]
    ADM_DASH --> ADM_DEPT[Manage Departments]
    ADM_DASH --> ADM_COORD[Manage Coordinators]
    ADM_DASH --> ADM_SUPER[Manage Academic Supervisors]
    ADM_DASH --> ADM_INVITE[Send Invitations]
    ADM_DASH --> ADM_REPORTS[System Reports]
    ADM_DASH --> ADM_SETTINGS[System Settings]
    ADM_FAC --> ADM_FAC_DETAIL[Faculty Detail → Depts]
    ADM_DEPT --> ADM_DEPT_DETAIL[Department Detail → Coordinators]
    ADM_SUPER --> ADM_SUPER_DETAIL[Supervisor Detail → Students]
```

---

### Flowchart 3 — Coordinator

```mermaid
flowchart TD
    COORD([Coordinator Login]) --> COORD_DASH[Coordinator Dashboard]
    COORD_DASH --> COORD_STUDENTS[Manage Students]
    COORD_DASH --> COORD_PLACEMENTS[Review Placements]
    COORD_DASH --> COORD_SUPERVISORS[Supervisor Directory]
    COORD_DASH --> COORD_INVITE[Invite Users]
    COORD_DASH --> COORD_VISITS[Oversee Visits]
    COORD_DASH --> COORD_COMPLIANCE[Approve Compliance]
    COORD_DASH --> COORD_REPORTS[Final Reports]
    COORD_DASH --> COORD_ANALYTICS[Analytics & Export]
    COORD_STUDENTS --> COORD_STUDENT_DETAIL[Student Profile]
    COORD_STUDENT_DETAIL --> COORD_PLACE_ACTION{Two actions}
    COORD_PLACE_ACTION --> COORD_APPROVE[Approve/Reject Placement]
    COORD_PLACE_ACTION --> COORD_ASSIGN_SUPER[Assign Supervisors]
    COORD_PLACEMENTS --> COORD_PLACEMENT_LIST{Status?}
    COORD_PLACEMENT_LIST -->|Pending| COORD_PLACEMENT_REVIEW[Review & Approve/Reject]
    COORD_PLACEMENT_LIST -->|Approved| COORD_PLACEMENT_ASSIGN[Assign Industrial Supervisor]
```

---

### Flowchart 4 — Student

```mermaid
flowchart TD
    STUDENT([Student Login]) --> STD_DASH[Student Dashboard]
    STD_DASH --> STD_CHECK{Placement<br/>submitted?}
    STD_CHECK -->|No| STD_PLACEMENT_FORM[Submit Placement<br/>Company + Acceptance Letter]
    STD_PLACEMENT_FORM --> STD_AWAIT[Await Coordinator Approval]
    STD_CHECK -->|Yes| STD_APPROVED{Approved?}
    STD_APPROVED -->|No| STD_PLACEMENT_FORM
    STD_APPROVED -->|Yes| STD_ACTIVITIES{Activity}
    STD_ACTIVITIES --> STD_CHECKIN[Attendance<br/>Check-in / Check-out]
    STD_ACTIVITIES --> STD_LOGBOOK[Weekly Logbook Entry<br/>Tasks + Evidence]
    STD_ACTIVITIES --> STD_COMPLIANCE[Upload Compliance Forms]
    STD_ACTIVITIES --> STD_FINAL_REPORT[Upload Final Report]
    STD_ACTIVITIES --> STD_VISITS[View Scheduled Visits]
    STD_ACTIVITIES --> STD_SUPERVISORS[View My Supervisors]

    STD_LOGBOOK -->|Submit| STD_LOG_REVIEW{Review}
    STD_LOG_REVIEW --> STD_LOG_IND[Industrial Sup. Reviews]
    STD_LOG_IND -->|Approved| STD_LOG_ACAD[Academic Sup. Final Approval]
    STD_LOG_IND -->|Rejected| STD_LOGBOOK
    STD_LOG_ACAD -->|Approved| STD_LOG_DONE[Week Locked]
    STD_LOG_ACAD -->|Rejected| STD_LOGBOOK

    STD_COMPLIANCE -->|Submit| STD_COMP_REVIEW{Coordinator}
    STD_COMP_REVIEW -->|Approved| STD_COMP_DONE[Form Accepted]
    STD_COMP_REVIEW -->|Rejected| STD_COMPLIANCE

    STD_FINAL_REPORT -->|Submit| STD_REP_REVIEW{Coordinator}
    STD_REP_REVIEW -->|Approved| STD_REP_DONE[Report Approved]
    STD_REP_REVIEW -->|Rejected| STD_FINAL_REPORT
```

---

### Flowchart 5 — Academic / Departmental Supervisor

```mermaid
flowchart TD
    AS([Academic Supervisor Login]) --> AS_DASH[Dashboard]
    AS_DASH --> AS_STUDENTS[My Students]
    AS_DASH --> AS_LOGBOOKS[Review Logbooks]
    AS_DASH --> AS_VISITS[Schedule Visits]
    AS_DASH --> AS_ATTENDANCE[Approve Attendance]

    AS_LOGBOOKS --> AS_LOG_ACTION{Decision}
    AS_LOG_ACTION -->|Approve| AS_LOG_OK[Week Approved]
    AS_LOG_ACTION -->|Reject| AS_LOG_REJ[Send Back to Student]

    AS_VISITS --> AS_VISIT_SCHEDULE[Schedule Visit<br/>Physical / Virtual]
    AS_VISIT_SCHEDULE --> AS_VISIT_CONDUCT[Conduct Visit]
    AS_VISIT_CONDUCT --> AS_VISIT_REPORT[Record Feedback & Score]

    AS_STUDENTS --> AS_ASSESS[Create Assessment<br/>Score + Grade]
```

---

### Flowchart 6 — Industrial Supervisor

```mermaid
flowchart TD
    IS([Industrial Supervisor Login]) --> IS_DASH[Dashboard]
    IS_DASH --> IS_STUDENTS[My Students]
    IS_DASH --> IS_LOGBOOKS[Review Logbooks]
    IS_DASH --> IS_ATTENDANCE[Approve Attendance]
    IS_DASH --> IS_ASSESSMENTS[Create Assessments]

    IS_LOGBOOKS --> IS_LOG_ACTION{Decision}
    IS_LOG_ACTION -->|Approve| IS_LOG_OK[Forward to Academic Sup.]
    IS_LOG_ACTION -->|Reject| IS_LOG_REJ[Send Back to Student]

    IS_ATTENDANCE --> IS_ATT_OK[Approve/Reject Attendance]
    IS_ASSESSMENTS --> IS_ASSESS_DONE[Assessment Recorded]
```

---

## Deployment Architecture Diagram

> **ChatGPT prompt (paste this into ChatGPT to generate the image):**
>
> Generate a clean deployment architecture diagram as an SVG with white background and no fill. Use black thin borders (1px), black text, Arial font, 11pt. The layout is horizontal from left to right.
>
> Boxes to include:
> - **CLIENT LAYER** (group box): contains "Browser / Mobile App" and "PWA Service Worker"
> - **RENDER.COM** (group box): contains "Frontend" box with "Next.js :3000", and "Backend" box with "Express :10000", "Socket.io", "JWT Auth"
> - **DATA LAYER** (group box): contains cylinder icon "PostgreSQL" and "Local Uploads" folder
> - **Cloudinary** (standalone component)
> - **Brevo / SendGrid** (standalone component)
>
> Arrows with black thin lines:
> - Browser/Mobile App → Next.js
> - PWA Service Worker → Next.js
> - Next.js → Express (label: HTTP/REST)
> - Next.js → Cloudinary
> - Express → JWT Auth → PostgreSQL, Local Uploads, Brevo/SendGrid
> - Socket.io ↔ Browser/Mobile App
> - Socket.io → Next.js

---

## High-Level Three-Tier Architecture

> **ChatGPT prompt (paste this into ChatGPT to generate the image):**
>
> Generate a clean three-tier architecture diagram as an SVG with transparent background, no fill, black thin borders (1px), black text, Arial 11pt. Layout is vertical with three horizontal tiers stacked top to bottom.
>
> **Tier 1 — PRESENTATION LAYER (top):**
> Group box containing "Browser / Mobile App (Next.js)", "PWA Service Worker", "Admin Dashboard", "Student Portal", "Coordinator Panel". Styled as client-side boxes.
>
> **Tier 2 — APPLICATION LAYER (middle):**
> Group box containing "Express API Server (REST)", "Authentication & JWT Middleware", "Socket.io Real-time", "Business Logic: Placements, Logbooks, Assessments, Reports". Styled as server-side boxes.
>
> **Tier 3 — DATA LAYER (bottom):**
> Group box containing cylinder icon "PostgreSQL Database (Prisma ORM)", folder icon "File Uploads (Local / Cloudinary)", and "Email Service (Brevo/SendGrid)". Styled as data-store boxes.
>
> **Arrows (black thin lines):**
> - Vertical arrows from Presentation Layer down to Application Layer (label: HTTP REST API)
> - Vertical arrows from Application Layer down to Data Layer (label: Queries / ORM)
> - Bidirectional arrow between Browser/Mobile App and Socket.io (label: WebSocket)
>
> Label each tier clearly in bold at the top-left of its group box. — End-to-End

> **ChatGPT prompt (paste this into ChatGPT to generate the image):**
>
> Generate a vertical swimlane/activity diagram as an SVG with transparent background, no fill, black thin borders (1px), black text, Arial 11pt. Each swimlane is a bordered box labeled at the top and contains steps connected by arrows.
>
> **Swimlane 1 — SETUP:** Admin creates Faculties & Departments → Admin invites Coordinators → Coordinator invites Students & Supervisors
>
> **Swimlane 2 — ONBOARDING:** Student receives invitation → Student sets up account → Student logs in
>
> **Swimlane 3 — PLACEMENT:** Student submits placement details → Coordinator reviews placement → diamond decision (Approved?) — Yes arrow leads to "Supervisors assigned", No arrow loops back to "Student submits placement details"
>
> **Swimlane 4 — TRAINING:** Student checks in daily → Student submits weekly logbook → Industrial supervisor reviews → Academic supervisor approves → Student uploads compliance forms → Coordinator approves
>
> **Swimlane 5 — EVALUATION:** Supervisor schedules visit → Visit conducted → Assessments scored → Final grade calculated
>
> **Swimlane 6 — COMPLETION:** Student submits final report → Coordinator reviews report → diamond decision (Approved?) — Yes arrow leads to "Training marked complete" then "Records archived", No arrow loops back to "Student submits final report"
>
> Connect the swimlanes sequentially (SETUP → ONBOARDING → PLACEMENT → TRAINING → EVALUATION → COMPLETION) with a downward arrow between them.

---

## Stakeholder Interaction Diagram

> **ChatGPT prompt (paste this into ChatGPT to generate the image):**
>
> Generate a stakeholder interaction diagram (use case style) as an SVG with transparent background, no fill, black thin borders and lines (1px), black text, Arial 11pt. Layout: actors at the top (horizontal row), use case boxes below them, with straight connector lines.
>
> **Actors (top row, left to right):** Admin, Coordinator, Student, Academic Supervisor, Industrial Supervisor (use stick figures)
>
> **Use case boxes (below, arranged in rows):**
> - System Config, Invitations, User Management, Reports & Analytics
> - Placements, Logbooks, Attendance, Student Assessment
>
> **Connections (lines between actors and use cases):**
> - Admin → System Config, Reports, Invitations, User Management
> - Coordinator → Placements, Reports, Invitations, User Management
> - Student → Placements, Logbooks, Attendance
> - Academic Supervisor → Logbooks, Student Assessment, Attendance
> - Industrial Supervisor → Logbooks, Student Assessment, Attendance

---

### Flowchart 7 — Notifications & Settings (Cross-Cutting)

> **ChatGPT prompt (paste this into ChatGPT to generate the image):**
>
> Generate a simple flowchart as an SVG with transparent background, no fill, black thin borders (1px), black text, Arial 11pt. The flow is top-to-bottom.
>
> **Steps (in order):**
> 1. Rounded box "System Event"
> 2. Arrow down to rectangle "Notification Engine"
> 3. Arrow down to diamond decision "Type?" with three branches:
>    - "In-App" → rectangle "In-App Alert"
>    - "Email" → rectangle "Email Sent"
>    - "Push" → rectangle "Push Notification"
> 4. All three branches merge into diamond decision "User Opt-in?" with two branches:
>    - "Yes" → rounded box "Delivered"
>    - "No" → rounded box "Suppressed"
> 5. Both branches end.
