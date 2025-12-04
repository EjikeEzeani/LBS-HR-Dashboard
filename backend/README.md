# HR Analytics Backend

Node.js + TypeScript service that ingests HR Excel reports, normalizes the
data into Postgres/SQLite, and exposes dashboard-ready APIs for the VO
frontend bundle.

## Quick start

1. `cd backend`
2. Install deps: `npm install`
3. Copy `.env.example` → `.env` and adjust DB + auth config
4. Run migrations: `npm run migrate`
5. Start dev server: `npm run dev`
6. Upload an Excel file via `POST /api/uploads/excel` (`file` field).

## Scripts

| Script          | Description                                |
| --------------- | ------------------------------------------ |
| `npm run dev`   | ts-node-dev hot reload server              |
| `npm run build` | Emit JS to `dist/`                         |
| `npm start`     | Run compiled server with dotenv            |
| `npm run test`  | Vitest unit/integration suite              |
| `npm run migrate` | Apply SQL migrations via Knex CLI       |

## API surface

High-level endpoints (see `openapi.yaml` for detail):

- `POST /api/uploads/excel` – upload template/vendor HR reports
- `GET /api/uploads/:id/status` – polling for ingestion status
- `GET /api/dashboards/kpis?period=YYYY-MM` – top-level KPIs
- `GET /api/dashboards/department/:deptId` – department deep dive
- `GET /api/leave/summary?period=YYYY-MM` – leave analytics payload
- `GET /api/exports/report` – Excel export mirroring vendor report
- `GET /api/admin/uploads` – admin/audit views
- `POST /api/webhook/upload_complete` – push notifications/SSE

## Project structure

```
backend/
├─ src/
│  ├─ server.ts            # HTTP entry
│  ├─ app.ts               # express app wiring
│  ├─ routes/              # grouped routers
│  ├─ services/            # parsing, uploads, exports
│  ├─ db/                  # Knex config/helpers
│  └─ utils/               # validation helpers, caching
├─ migrations/             # SQL migrations
├─ tests/                  # Vitest suites (supertest)
├─ hr_upload_template/     # canonical upload template
└─ openapi.yaml            # swagger spec for VO FE
```

## Testing locally

```
npm run migrate
npm run dev &
curl -F \"file=@hr_upload_template/HR_Upload_Template.xlsx\" http://localhost:4000/api/uploads/excel
npm run test
```

Integration tests use fixtures derived from the August & September 2025
reports located under `tests/fixtures/`.

## Notes

- Default DB is SQLite (file). Set `DATABASE_CLIENT=pg` and provide a
  Postgres URL when running in production or CI.
- Uploads are stored in `UPLOADS_DIR` and processed asynchronously.
- SSE/WebSocket notifications are dispatched when an upload finishes.
- Cache-heavy endpoints are invalidated on successful ingestion.

