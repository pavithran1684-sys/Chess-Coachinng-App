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

### First-time Coach / Admin setup

Open the web application. When the connected database has no coach account, ChessDesk displays a one-time **Create your Coach / Admin account** form instead of the login form.

1. Enter your name and your own email address.
2. Choose a private password of at least 12 characters and confirm it.
3. Submit the form. ChessDesk hashes the password with bcrypt, saves the coach in the existing SQLite database, and opens the Coach Dashboard.

After setup, sign in with the email and password you entered. There are no default or hardcoded development credentials. The setup form closes permanently once a coach exists.

### Create student accounts

Students do not self-register. After signing in as the coach:

1. Create at least one institution in **Institutions**.
2. Open **Students → Add student**.
3. Enter the student’s details, select the institution, and set an individual initial password.
4. Save the account. ChessDesk displays the generated unique username; it also remains visible in the Students table.
5. Give that username and password privately to the student. They can then use **Student Login**.
6. Use the key icon beside a student to reset their password. Resetting revokes that student’s existing sessions.

## Environment variables

Copy `.env.example` as a reference. Do not commit `.env` files. Coach credentials are normally created through the one-time web setup and are not needed in `.env`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `COACH_EMAIL` | Optional unattended initial coach email; requires `COACH_PASSWORD` | Unset; use web setup |
| `COACH_PASSWORD` | Optional unattended initial coach password; requires `COACH_EMAIL` | Unset; use web setup |
| `COACH_NAME` | Optional display name for environment-based provisioning | Chess Coach |
| `DATABASE_PATH` | SQLite database location | `./data/chessdesk.db` |
| `UPLOAD_DIR` | Protected uploaded-file location | `./data/uploads` |
| `PORT` | Node API/server port | `3001` |

Passwords are never stored in plain text. Uploaded files are served only through authenticated, institution-scoped endpoints.

## Production build

For a local production run, optionally create `.env` from `.env.example` to override storage paths. Coach credentials can be created in the browser after startup. Then run:

```bash
npm ci
npm run build
npm start
```

`npm run build` creates the optimized frontend in `dist/`. `npm start` runs the Node server in production mode, serves the API and built frontend, and supports direct React Router navigation. A new empty database starts at the first-time coach setup screen; production environment credentials are optional.

The SQLite schema is maintained in `server/db.js` and initialized automatically when the server starts. Existing tables and records are preserved, no duplicate database is created, and no separate migration command is required for this version.

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

1. Sign in to [Render](https://dashboard.render.com/) and select **New + → Web Service**. Do not select **Static Site**, and do not overwrite or delete any existing service.
2. Connect your GitHub account if prompted, then select `pavithran1684-sys/Chess-Coaching-App`.
3. Use the unique service name `chessdesk-app`, choose a region, and select the `backend-dev` branch. Render should detect the **Node** runtime. `package.json` pins the verified Node.js 24 and npm 11 major versions.
4. Enter these commands exactly:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm ci && npm run build` |
   | Start command | `npm start` |

5. Select an instance type that supports persistent disks.

**Do not deploy ChessDesk as a Static Site.** A static frontend cannot execute the Express authentication/API routes and can return `index.html` for `/api/auth/login`. The frontend and backend must run together through `npm start` in the same Node Web Service. A `render.yaml` Blueprint is included as an alternative to manual setup; review its paid `0.5c-512mb` compute plan and persistent-disk settings before deploying because they incur charges. If the Blueprint preview shows an existing service being updated instead of a new `chessdesk-app` service being created, stop and choose another unused name.

### 2. Attach persistent storage

In the service settings, open **Disks** and add a disk with:

| Setting | Value |
| --- | --- |
| Name | `chessdesk-data` |
| Mount path | `/data` |
| Size | Choose a size appropriate for your database and class-note files |

Keep this disk attached to the same service for every deployment. The application creates the SQLite database and upload subdirectories automatically. Do not put either on Render’s ephemeral application filesystem.

### 3. Configure environment variables

In **Environment**, add the persistent-storage variables. Coach credentials are not required: use the first-time browser setup after deployment. Never commit credentials to GitHub.

| Key | Example or required value |
| --- | --- |
| `DATABASE_PATH` | `/data/chessdesk.db` |
| `UPLOAD_DIR` | `/data/uploads` |

For unattended provisioning instead of browser setup, you may optionally set all three of these before the first startup: `COACH_EMAIL`, a strong private `COACH_PASSWORD` of at least 12 characters, and `COACH_NAME`. Do not set only one of the email/password pair.

Do **not** set `PORT`: Render supplies it automatically. `npm start` enables production mode and secure session cookies.

The coach variables bootstrap the first account only when the database has no coach. Changing them later does not change an existing account’s sign-in details. Keep the database to preserve the account and all application records. If you use browser setup, complete it immediately after the first deployment; the unauthenticated setup endpoint is available only while no coach exists and closes after the first account is created.

### 4. Deploy and verify

1. Under health-check settings, set **Health Check Path** to `/api/health`.
2. Select **Create Web Service** or **Deploy latest commit** and wait for the build and deployment to finish.
3. Open `https://YOUR-SERVICE.onrender.com/api/health`; it should return `{"status":"ok"}`.
4. Open the service URL. If you did not provision a coach through environment variables, complete the one-time Coach / Admin setup immediately using your own email and password; otherwise choose **Coach/Admin** and sign in with the provisioned credentials.
5. Verify the Coach Dashboard and a deep link such as `https://YOUR-SERVICE.onrender.com/students` while signed in.

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

The test command includes frontend authentication-response validation and an empty-database first-time coach setup test. The workflow integration test uses an isolated temporary database and covers valid/invalid coach and student logins, institution creation, two-student assignment, concept/note/homework visibility, tournament privacy, class completion, and student/admin authorization boundaries. Supplemental checks cover management edit/delete workflows, protected file retention/removal, password-reset session revocation, and logout.

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
