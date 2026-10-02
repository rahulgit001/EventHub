# EventHub

EventHub is a full-stack event rental and booking management application. It includes customer bookings, date-based inventory, vehicle and catering services, staff assignment, quotations, invoices, payment tracking, notifications, and admin reports.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Redux Toolkit, Axios, Recharts, Lucide
- Backend: Python, FastAPI, SQLAlchemy, Pydantic, JWT
- Database: PostgreSQL for Compose; SQLite for local development and tests
- Invoice and quotation documents: browser print dialog, including Save as PDF

## Run Locally

1. Create a virtual environment and install the backend dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

2. Start the API from the repository root:

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

3. In another terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. For local development, the API seeds an admin account (`admin@eventhub.in` / `admin123`) and a customer account (`customer@eventhub.in` / `customer123`). Override these through environment variables before exposing the app to a network.

## Run with Docker Compose

Copy `.env.example` to `.env`, replace the secret key, database password, and bootstrap account passwords with unique values, then build and start the complete stack:

```bash
cp .env.example .env
docker compose up --build
```

The web app is available at `http://localhost:5173`, the API at `http://localhost:8000`, and interactive API docs at `http://localhost:8000/docs`. Compose waits for PostgreSQL and the API health checks before starting dependent services. The PostgreSQL data is stored in the `postgres_data` volume.

The Compose bootstrap accounts use `BOOTSTRAP_ADMIN_*` and `DEMO_CUSTOMER_*` from `.env`; change them before startup. The initial credentials are only used when the corresponding users do not already exist.

To stop the services while preserving database data, run `docker compose down`. `docker compose down -v` also deletes the database volume.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy database URL; Compose generates the PostgreSQL URL |
| `SECRET_KEY` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access-token lifetime |
| `CORS_ORIGINS` | Comma-separated allowed browser origins |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Compose PostgreSQL settings |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | First admin account credentials |
| `DEMO_CUSTOMER_EMAIL`, `DEMO_CUSTOMER_PASSWORD` | Seed customer credentials |
| `VITE_API_BASE_URL` | API URL compiled into the frontend bundle |

## Validation

```bash
source .venv/bin/activate
pytest backend/tests -q
npm --prefix frontend run build
```

The Docker setup is a deployable baseline, not a complete production operations package. Before public deployment, use a managed secrets store, TLS/reverse proxy, database backups, monitoring, schema migrations, and a real payment gateway. Payments currently require manual admin confirmation; booking inventory is reserved for the full event date.
