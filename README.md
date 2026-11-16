# ChessDesk

ChessDesk is an integrated chess coaching management system with separate coach/admin and student experiences. It includes secure role-based authentication, institution-wise assignments, persistent SQLite records, and protected educational file sharing.

## Features

### Coach / Admin

- Live student and institution counts
- Monthly institution class calendar with persistent completion status
- Institution CRUD with associated student counts
- Student CRUD, automatic unique usernames, and secure password resets
- Chess concept CRUD with multi-institution assignment
- Tournament history, timeline, score graphs, and previous-result comparisons
- Institution-wise class-note uploads, editing, deletion, viewing, and downloading
- Institution-wise homework publishing and management
- Editable mentor profile for the student About Mentor page

### Students

- Personal dashboard with live notes, concept, homework, and achievement counts
- My Notes with protected file viewing and downloads
- Concepts Completed with persistent personal completion status
- Homework with pending/completed status
- My Achievements with only the signed-in student’s tournament records
- About Mentor with the coach’s professional profile

Students cannot access coach APIs, administrative pages, unrelated institutions’ materials, or other students’ records.

## Technology

- React 19 + TypeScript
- Vite + Tailwind CSS
- React Router
- Node.js + Express
- SQLite via better-sqlite3
- bcrypt password hashing and random, hashed HTTP-only session tokens
- Multer for validated file uploads

## Prerequisites

- Node.js 24 recommended
- npm 11 recommended

## Install and run locally

Extract the project ZIP, open a terminal in the extracted `ChessDesk` directory, and run:

```bash
npm ci
npm run dev
```

Use `npm install` instead of `npm ci` only if you intentionally want npm to resolve or update the dependency lockfile.

The command starts both processes:

- Web application: `http://localhost:5173`
- API server: `http://localhost:3001`

Vite proxies `/api` requests to the Node server.

For local development only, the initial coach account is created automatically:

```text
Email: coach@chessdesk.local
Password: Coach@123
```

Change or remove this account before using real student data. Production requires explicit coach credentials through environment variables.

## Environment variables

Copy `.env.example` as a reference. Do not commit `.env` files.

| Variable | Purpose | Default |
| --- | --- | --- |
| `COACH_EMAIL` | Initial coach email; required in production | Development account only |
| `COACH_PASSWORD` | Initial coach password; required in production | Development account only |
| `COACH_NAME` | Initial coach display name | Chess Coach |
| `DATABASE_PATH` | SQLite database location | `./data/chessdesk.db` |
| `UPLOAD_DIR` | Protected uploaded-file location | `./data/uploads` |
| `PORT` | Node API/server port | `3001` |

Passwords are never stored in plain text. Uploaded files are served only through authenticated, institution-scoped endpoints.

## Production build

For a local production run, first create `.env` from `.env.example` and replace the coach placeholders with your own local credentials. Then run:

```bash
npm ci
npm run build
npm start
```

`npm run build` creates the optimized frontend in `dist/`. `npm start` runs the Node server in production mode, serves the API and built frontend, and supports direct React Router navigation. In production, a new database requires valid `COACH_EMAIL` and `COACH_PASSWORD` values; the password must have at least 12 characters and no more than 72 UTF-8 bytes.

The SQLite schema is maintained in `server/db.js` and initialized automatically when the server starts. No separate migration command is required for this version.

## Upload the project to GitHub

1. Extract the ZIP. The archive contains one top-level `ChessDesk/` directory.
2. Sign in to [GitHub](https://github.com/) and create a new, empty repository. Do not initialize it with a README, `.gitignore`, or license because this project already includes its own files.
3. Open a terminal in the extracted project directory:

   ```bash
   cd ChessDesk
   ```

4. Initialize Git, commit the complete source, and push it to your new repository. Replace the placeholder URL with the HTTPS URL shown by GitHub:

   ```bash
   git init
   git add .
   git commit -m "Deploy complete ChessDesk application"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

5. Confirm on GitHub that `src/`, `server/`, `public/`, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, and the configuration files are present. The `data/`, `dist/`, and `node_modules/` directories should not be committed.

If the repository already has a `main` branch, pull or clone it first and copy the extracted source into that working tree instead of initializing a new repository.

## Deploy to Render

### 1. Create the web service

1. Sign in to [Render](https://dashboard.render.com/) and select **New + → Web Service**.
2. Connect your GitHub account if prompted, then select the ChessDesk repository.
3. Choose a name, region, and the `main` branch. Render should detect the **Node** runtime. `package.json` pins the verified Node.js 24 and npm 11 major versions.
4. Enter these commands exactly:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm ci && npm run build` |
   | Start command | `npm start` |

5. Select an instance type that supports persistent disks.

### 2. Attach persistent storage

In the service settings, open **Disks** and add a disk with:

| Setting | Value |
| --- | --- |
| Name | `chessdesk-data` |
| Mount path | `/data` |
| Size | Choose a size appropriate for your database and class-note files |

Keep this disk attached to the same service for every deployment. The application creates the SQLite database and upload subdirectories automatically. Do not put either on Render’s ephemeral application filesystem.

### 3. Configure environment variables

In **Environment**, add the following variables. Use your own private values for the coach account; never commit them to GitHub.

| Key | Example or required value |
| --- | --- |
| `COACH_EMAIL` | Your private coach sign-in email |
| `COACH_PASSWORD` | A new strong password with at least 12 characters (maximum 72 UTF-8 bytes) |
| `COACH_NAME` | Your display name |
| `DATABASE_PATH` | `/data/chessdesk.db` |
| `UPLOAD_DIR` | `/data/uploads` |

Do **not** set `PORT`: Render supplies it automatically. `npm start` enables production mode and secure session cookies.

The coach variables bootstrap the first account only when the database has no coach. Changing them later does not change an existing account’s sign-in details. Keep the database to preserve the account and all application records.

### 4. Deploy and verify

1. Under health-check settings, set **Health Check Path** to `/api/health`.
2. Select **Create Web Service** or **Deploy latest commit** and wait for the build and deployment to finish.
3. Open `https://YOUR-SERVICE.onrender.com/api/health`; it should return `{"status":"ok"}`.
4. Open the service URL, choose **Coach/Admin**, and sign in using the private credentials configured in Render.
5. Verify a dashboard deep link such as `https://YOUR-SERVICE.onrender.com/students` while signed in.

For later updates, commit and push to the tracked GitHub branch. With Render’s default auto-deploy enabled, the service rebuilds and restarts automatically.

## Persistent-data and deployment notes

- The SQLite database, its SQLite sidecar files, and uploaded notes must remain on the attached `/data` disk. Without that disk, redeployments or restarts can remove application data.
- Use a single web-service instance with the SQLite database and attached disk; do not run multiple application instances against the same files.
- Back up both `/data/chessdesk.db` and `/data/uploads/` before major changes. Use Render’s available disk backup/snapshot features where applicable.
- Uploaded files are not committed to Git and are not public static assets. They are served only through authenticated, institution-scoped application endpoints.

## Tests and quality checks

```bash
npm test
npm run lint
npm run build
```

The workflow integration test uses an isolated temporary database and covers institution creation, two-student assignment, concept/note/homework visibility, tournament privacy, class completion, and student/admin authorization boundaries. Supplemental checks cover management edit/delete workflows, protected file retention/removal, password-reset session revocation, and logout.

## Project structure

```text
server/                       # Express API, SQLite schema, auth, uploads, tests
src/
├── app/                      # Role-protected route registration
├── components/
│   ├── auth/                 # Authentication route guards
│   ├── layout/               # Coach and student responsive shells
│   └── ui/                   # Shared design-system components
├── config/                   # Coach navigation
├── context/                  # Session and authentication state
├── features/
│   ├── auth/                 # Role selection and login
│   ├── coaching/             # Mentor profile
│   ├── concepts/             # Concept management
│   ├── dashboard/            # Live overview and class calendar
│   ├── homework/             # Homework management
│   ├── institutions/         # Institution management
│   ├── notes/                # Class-note uploads and sharing
│   ├── performance/          # Student tournament management
│   ├── student/              # Student dashboard and resources
│   └── students/             # Student account management
├── lib/                      # API client and form styles
├── types/                    # Shared frontend data contracts
├── index.css                 # Tailwind theme and global styles
└── main.tsx                  # React entry point
```

## Storage

The database and uploads are kept under `data/` by default and excluded from Git. Database foreign keys and unique constraints protect relationships and prevent duplicate account or institution identities. Uploaded files are limited to 10 MB and are never publicly exposed as static files.
