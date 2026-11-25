# Student Information Management System

A web app for storing, finding, viewing and updating student records. Built from the Group 2 title proposal (BSIT 2C) on the stack from the Lesson 5 deck.

| Layer | Tool | Port |
| --- | --- | --- |
| Frontend | React with Vite, Heroicons | 5173 |
| Backend | Node.js and Express | 3001 |
| Database | MySQL (MariaDB) in XAMPP | 3306 |
| Storage | Student photos saved in `server/uploads` | n/a |

## What it does

- **Dashboard** shows total students, how many are active, inactive or graduated, students by course and by year level, and the five newest records.
- **Student records** lists every student with search (name, student ID, email, course), a status filter and paging.
- **Add and edit** a student: student ID, name, email, course, year level, status and an optional photo.
- **My record** gives a student a read-only view of their own information.
- **Accounts** lets the administrator see every account and reset a forgotten password.

### Who can do what

| | Administrator | Staff | Student |
| --- | --- | --- | --- |
| Dashboard and search | Yes | Yes | No |
| Add and edit students | Yes | Yes | No |
| Delete students | Yes | No | No |
| See own record | Yes | Yes | Yes (own only) |
| Reset passwords, see accounts | Yes | No | No |

Account rules:

- There is exactly one administrator. The database enforces this, and sign-up can never create one.
- Staff and students sign up themselves at `/register`, with no limit on how many.
- A student signs up with their **student ID and the email on file**, so the account links to the right record.
- Forgotten passwords go through the administrator (Accounts page, key icon).

## Quick start (Windows with XAMPP)

You need Node.js 20.19 or newer (`node -v`) and XAMPP.

1. **Start MySQL.** Open the XAMPP Control Panel and click Start on MySQL. Start Apache too, so phpMyAdmin opens.
2. **Create the database.** Go to `http://localhost/phpmyadmin`, open the **Import** tab, choose `database/schema.sql` and click Go. This creates `school_db` with the `students` and `users` tables.
3. **Create your settings file.** Copy `server/.env.example` to `server/.env`. Set `JWT_SECRET` to a long random text and set `ADMIN_PASSWORD`.
   ```
   copy server\.env.example server\.env
   ```
4. **Install everything.**
   ```
   npm run setup
   ```
5. **Add sample data and the administrator.**
   ```
   npm run seed
   ```
6. **Run the app.**
   ```
   npm run dev
   ```
   Open `http://localhost:5173`. Log in as `admin` with the password from `server/.env` (default `Admin@12345`).

### Try the three roles

1. Log in as the administrator and add a student.
2. Log out. On **Create an account**, choose Student and use ID `2026-001` with email `ana.reyes@example.com`. You land on the student's own record.
3. Log out and sign up as Staff. You can search, add and edit, but not delete.
4. As administrator, open **Accounts** and reset a password.

### Run it as one server

```
npm run build
npm start
```

Express then serves the built React app and the API together at `http://localhost:3001`.

## Database and storage

- **Database:** all records live in MySQL. The `students` table holds the records and `users` holds the logins. Passwords are stored as bcrypt hashes. Every query uses `?` placeholders, which blocks SQL injection.
- **Storage:** an uploaded photo (JPG, PNG or WEBP, up to 2 MB) is saved in `server/uploads` under a random name. The database stores only the file name. Replacing or removing a photo, or deleting a student, deletes the old file. `server/uploads` is ignored by Git.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Installs the root, server and client packages |
| `npm run dev` | Runs the API and the React app together |
| `npm run seed` | Adds sample students and the administrator |
| `npm run build` | Builds the React app into `client/dist` |
| `npm start` | Runs the API and serves `client/dist` if it exists |

## API

All routes except login and register need `Authorization: Bearer <token>`.

| Method and path | Who | Purpose |
| --- | --- | --- |
| `POST /api/auth/login` | Anyone | Log in |
| `POST /api/auth/register` | Anyone | Sign up as staff or student |
| `GET /api/auth/me` | Logged in | Current account |
| `GET /api/dashboard/summary` | Admin, staff | Dashboard numbers |
| `GET /api/students?q=&status=&page=&limit=` | Admin, staff | Search and list |
| `POST /api/students` | Admin, staff | Add (multipart form, optional `photo`) |
| `GET /api/students/:id` | Admin, staff, own student | One record |
| `PUT /api/students/:id` | Admin, staff | Edit (`remove_photo=true` removes the photo) |
| `DELETE /api/students/:id` | Admin | Delete |
| `GET /api/users` | Admin | List accounts |
| `PUT /api/users/:id/password` | Admin | Reset a password |
| `GET /api/health` | Anyone | Checks the database connection |

## Project structure

```
database/schema.sql      tables for school_db
server/                  Express API
  index.js               app setup, static files, error handling
  config.js, db.js       settings from .env, MySQL pool
  routes/                auth, students, dashboard, users
  middleware/            login check, roles, photo upload
  seed.js                sample data and the administrator
  uploads/               stored photos (not committed)
client/                  React app (Vite)
  vite.config.js         dev server on 5173, proxy to :3001
  src/pages/             Login, Register, Dashboard, Students, StudentForm, StudentDetail, Accounts
  src/components/        Layout, Field, Modal, States, Toast and others
```

## Put it on GitHub

```
git init
git add .
git commit -m "Student Information Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

`.gitignore` already keeps `node_modules`, `server/.env`, build output and uploaded photos out of the repository. Commit the `package-lock.json` files that `npm run setup` creates. Anyone who clones the repo repeats the Quick start from step 2.

## When something breaks

| Symptom | Cause and fix |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL is off. Start it in the XAMPP Control Panel. |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` or `DB_PASSWORD` in `server/.env`. XAMPP default is `root` with an empty password. |
| `ER_BAD_DB_ERROR` or `ER_NO_SUCH_TABLE` | Import `database/schema.sql` in phpMyAdmin. |
| Schema import fails on `admin_slot` | The MariaDB in your XAMPP is older than 10.2. Update XAMPP. |
| Page loads but data does not | Check the Network tab. A `(failed)` request means the API is off or on another port. |
| Port 5173 or 3001 in use | Another dev server is running. Stop it, or change `PORT` in `server/.env` and the proxy in `client/vite.config.js`. |
| Blank white page | Open the Console and fix the first red error. |

## Security notes

- Anyone can sign up as **staff**, and staff can edit every record. Before real use, require the administrator to approve staff accounts.
- Photos are served from `/uploads` by their random file name, without a login check.
- Set a long random `JWT_SECRET` and change the administrator password before you deploy.

## Not included (from the proposal)

Online enrollment, grade computation and report cards, tuition payments, integration with other school systems, and offline access.
