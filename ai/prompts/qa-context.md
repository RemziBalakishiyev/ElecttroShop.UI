# QA Context

## Local URLs

Admin frontend:
http://localhost:5173

User frontend:
http://localhost:5174

Backend API:
https://localhost:44312/

## Test Users

Admin:
Email: admin@electroshop.az
Password: Admin123!

## Test Rules

- Use Playwright MCP.
- Test only frontend UI.
- Do not edit backend.
- Do not delete, cancel, approve payment, or perform irreversible actions.
- You may create test records only if they start with QA*TEST*.
- Check browser console errors.
- Check failed network/API requests.
- Save final report to ai/reports/latest-ui-report.md.

## Ownership Classification Rules

Classify issues like this:

### Frontend Issue

Use this when:

- UI sends wrong payload
- UI calls malformed URL
- Client-side validation does not work
- Button/modal/table/form renders incorrectly
- Translation key is missing
- UI state is wrong
- Frontend calls API before required data is selected

### Backend Issue

Use this when:

- Valid request returns 500
- Valid request returns wrong data
- Pagination/filtering is incorrect
- Backend ignores valid query params
- Backend returns inconsistent response shape
- Backend validation message is wrong or missing
- Backend returns success but data is not persisted

### Contract/API Mismatch

Use this when:

- OpenAPI/Swagger says one thing but API returns another
- Frontend generated client expects field but backend does not return it
- Backend requires a field not documented in contract
- Status/enum values differ between frontend and backend

### Data/Environment Issue

Use this when:

- Frontend server is not running
- Backend server is not running
- Test user is missing
- Test data is missing
- Database seed is incomplete
- CORS/certificate/local port issue blocks testing

### Unknown / Needs Investigation

Use this when:

- Evidence is not enough to assign owner
- Both frontend and backend may be responsible
- More logs/code inspection is required
