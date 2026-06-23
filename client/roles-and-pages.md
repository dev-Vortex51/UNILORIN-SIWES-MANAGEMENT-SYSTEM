# Roles & Pages

## Roles

| Role | Segment | Description |
|---|---|---|
| `admin` | `/admin/*` | System administrator |
| `coordinator` | `/coordinator/*` | Program coordinator |
| `academic_supervisor` | `/d-supervisor/*` | Academic / departmental supervisor |
| `industrial_supervisor` | `/i-supervisor/*` | Industry-based supervisor |
| `student` | `/student/*` | Student |

> **Note:** `faculty` and `department` exist in the database/backend constants but are not actively used in any frontend routes or authorization logic.

---

## Public Pages (no auth required)

| Route | Description |
|---|---|
| `/login` | Login |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset |
| `/invite/verify?token=` | Invite verification |
| `/invite/setup?token=` | Invite account setup |

---

## Admin Pages (`/admin/*`)

| Route | Description |
|---|---|
| `/admin/dashboard` | Dashboard |
| `/admin/invitations` | Manage invitations |
| `/admin/faculties` | List faculties |
| `/admin/faculties/[id]` | Faculty details |
| `/admin/departments` | List departments |
| `/admin/departments/[id]` | Department details |
| `/admin/coordinators` | List coordinators |
| `/admin/coordinators/create` | Create coordinator |
| `/admin/academic-supervisors` | List academic supervisors |
| `/admin/academic-supervisors/create` | Create academic supervisor |
| `/admin/academic-supervisors/[id]` | Academic supervisor details |
| `/admin/evaluations` | Evaluations |
| `/admin/reports` | Reports |
| `/admin/settings` | Settings |
| `/admin/notification` | Notifications |

---

## Coordinator Pages (`/coordinator/*`)

| Route | Description |
|---|---|
| `/coordinator/dashboard` | Dashboard |
| `/coordinator/invitations` | Manage invitations |
| `/coordinator/students` | List students |
| `/coordinator/students/[id]` | Student details |
| `/coordinator/students/[id]/supervisors` | Student supervisor assignments |
| `/coordinator/students/[id]/placement` | Student placement details |
| `/coordinator/placements` | All placements |
| `/coordinator/evaluations` | Evaluations |
| `/coordinator/supervisors` | List supervisors |
| `/coordinator/supervisors/[id]` | Supervisor details |
| `/coordinator/visits` | Site visits |
| `/coordinator/compliance` | Compliance tracking |
| `/coordinator/final-reports` | Final reports |
| `/coordinator/reports` | Reports |
| `/coordinator/settings` | Settings |
| `/coordinator/notification` | Notifications |

---

## Academic / Departmental Supervisor Pages (`/d-supervisor/*`)

| Route | Description |
|---|---|
| `/d-supervisor/dashboard` | Dashboard |
| `/d-supervisor/students` | List students |
| `/d-supervisor/students/[id]` | Student details |
| `/d-supervisor/logbooks` | Student logbooks |
| `/d-supervisor/assessments` | Assessments |
| `/d-supervisor/evaluations` | Evaluations |
| `/d-supervisor/visits` | Site visits |
| `/d-supervisor/attendance` | Attendance records |
| `/d-supervisor/settings` | Settings |
| `/d-supervisor/notification` | Notifications |

---

## Industrial Supervisor Pages (`/i-supervisor/*`)

| Route | Description |
|---|---|
| `/i-supervisor/dashboard` | Dashboard |
| `/i-supervisor/students` | List students |
| `/i-supervisor/students/[id]` | Student details |
| `/i-supervisor/logbooks` | Student logbooks |
| `/i-supervisor/attendance` | Attendance records |
| `/i-supervisor/assessments` | Assessments |
| `/i-supervisor/settings` | Settings |
| `/i-supervisor/notification` | Notifications |

---

## Student Pages (`/student/*`)

| Route | Description |
|---|---|
| `/student/dashboard` | Dashboard |
| `/student/placement` | Placement details |
| `/student/attendance` | Mark/View attendance |
| `/student/visits` | Site visit records |
| `/student/compliance` | Compliance checklist |
| `/student/final-report` | Final report submission |
| `/student/logbook` | Logbook entries |
| `/student/supervisors` | View assigned supervisors |
| `/student/settings` | Settings |
| `/student/notification` | Notifications |
