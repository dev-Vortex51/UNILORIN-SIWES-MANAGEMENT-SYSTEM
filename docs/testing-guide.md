# Testing Guide — IITMS (SIWES Management System)

---

## Quick Start

```bash
# Run all backend tests with coverage
cd backend && npm test

# Run in watch mode during development
cd backend && npm run test:watch

# Seed database with sample data
cd backend && npm run seed

# Reset DB and reseed
cd backend && npx prisma migrate reset --force && npm run seed
```

---

## Test Types

### 1. Unit Tests

**Tool:** Jest + Supertest

**Location:** `backend/src/tests/`

Existing files:
- `authService.test.js` — login, password reset, change password
- `cache.middleware.integration.test.js` — Redis caching middleware
- `email-queue.integration.test.js` — BullMQ email queue

**Pattern:**
```js
const { getPrismaClient } = require("../../config/prisma");
const prisma = getPrismaClient();

describe("ServiceName", () => {
  beforeAll(async () => {
    // seed test data
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should do something", async () => {
    const result = await someFunction(input);
    expect(result).toBeDefined();
  });
});
```

**To add new tests:**
Create files matching `**/*.test.js` under `backend/src/tests/`.

---

### 2. Integration Tests

**Tool:** Jest + Supertest (already installed)

**Pattern:**
```js
const request = require("supertest");
const app = require("../../app");

describe("GET /api/v1/endpoint", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/placements");
    expect(res.status).toBe(401);
  });
});
```

**Coverage threshold (jest.config.js):** 70% branches/functions/lines/statements.

---

### 3. Seed Data

**Script:** `backend/src/scripts/seed.js`

Populates:
- Admin user
- Academic supervisor
- Industrial supervisor
- Faculty & Department
- Student with profile
- Placement with acceptance letter
- Logbook entries
- Attendance records
- Assessments

**Run:** `cd backend && npm run seed`

---

### 4. User Acceptance Testing (Manual)

Test each role's core flow:

| Role | Flow |
|---|---|
| **Admin** | Create Faculty → Create Department → Send Invitations → View Reports → System Settings |
| **Coordinator** | Review Placement → Approve/Reject → Assign Supervisor → Approve Compliance → Analytics |
| **Student** | Submit Placement → Upload Logbook → Check-in/out Attendance → Upload Compliance → Submit Final Report |
| **Academic Supervisor** | Review Logbook → Accept/Reject → Schedule Visit → Conduct Visit → Create Assessment |
| **Industrial Supervisor** | Review Logbook → Approve Attendance → Create Assessment |

---

### 5. Performance Tests

**Tool:** Artillery (install separately)

```bash
npm install -g artillery
```

Create a scenario file:
```yaml
# backend/tests/performance/scenario.yml
config:
  target: "http://localhost:10000/api/v1"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: "/auth/login"
          json:
            email: "student@test.com"
            password: "test123"
      - get:
          url: "/attendance?page=1"
```

Run:
```bash
artillery run backend/tests/performance/scenario.yml
```

---

### 6. Security Tests

**Dependency audit:**
```bash
cd backend && npm audit
cd client && npm audit
```

**DAST scanning (OWASP ZAP):**
```bash
docker run -v $(pwd):/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py -t http://localhost:10000 -r zap-report.html
```

**Manual security test checklist:**
- [ ] JWT tampering (expired tokens, wrong signatures)
- [ ] Role escalation (student accessing admin/coordinator endpoints)
- [ ] SQL injection on query params and body fields
- [ ] File upload validation (file type, size limits)
- [ ] XSS in user-supplied text fields
- [ ] Rate limiting on login endpoint
- [ ] Password strength enforcement

---

### 7. Client Tests

**Not yet set up.** To add:

```bash
cd client
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Add to `client/package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Configuration

| File | Purpose |
|---|---|
| `backend/jest.config.js` | Jest options, test matching, coverage thresholds |
| `backend/src/tests/setup.js` | Global setup (mutes console.log) |
| `backend/.env` | Database connection (required for tests hitting DB) |

---

## CI/CD

Currently no CI pipeline. To add GitHub Actions:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: IITMS_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci
      - run: cd backend && npm test
```

---

## Commands Reference

```bash
# Run all tests
cd backend && npm test

# Run with coverage
cd backend && npx jest --coverage --detectOpenHandles

# Watch mode
cd backend && npx jest --watch

# Run specific test file
cd backend && npx jest src/tests/services/authService.test.js

# Run tests matching a pattern
cd backend && npx jest --testNamePattern="placement"

# Seed database
cd backend && npm run seed

# Reset + reseed
cd backend && npx prisma migrate reset --force && npm run seed

# Performance test
npx artillery run backend/tests/performance/scenario.yml
```
