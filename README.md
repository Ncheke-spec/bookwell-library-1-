# Bookwell Library Management System

A beginner-friendly library coursework project with a React frontend, an Express REST API, and a MySQL relational database. The browser uses the Fetch API to communicate with Express. Books, members, stock movements, and transaction history are stored in MySQL.

## Project structure

```text
bookwell-library/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/        # Shared layout, book form/list, notices
│   │   ├── App.jsx            # Dashboard and routed pages
│   │   ├── api.js             # Fetch API helper and endpoints
│   │   └── styles.css
│   └── package.json
├── backend/                  # Express REST API
│   ├── database/schema.sql    # MySQL tables and starter admin member
│   ├── src/routes/            # Books, users and transactions endpoints
│   ├── src/db.js              # MySQL connection pool
│   ├── src/server.js          # Express app and middleware
│   └── .env.example
└── README.md
```

## Requirements

- Node.js 20.19 or newer (or Node.js 22.12 or newer) and npm
- MySQL Server 8 or newer
- A MySQL client such as MySQL Workbench or the `mysql` command line

## 1. Create the database

Start MySQL. Run `backend/database/schema.sql` using MySQL Workbench, or from a terminal run:

```bash
mysql -u root -p < backend/database/schema.sql
```

The script creates the `bookwell_library` database, the `books`, `users`, and `transactions` tables, and one starter administrator member. It does not add sample books, so you can enter your own books in the app.

## 2. Configure and start the backend

Open a terminal in `backend/` and run:

```bash
npm install
```

Copy `.env.example` to `.env`, then enter the username and password for your local MySQL account. For example:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=bookwell_library
FRONTEND_URL=http://localhost:5173
DEMO_PASSWORD=reader123
```

Start the API:

```bash
npm run dev
```

Open `http://localhost:4000/api/health`. A healthy setup responds with `{"status":"ok","database":"connected"}`.

## 3. Start the React frontend

Open a second terminal in `frontend/` and run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`). The frontend sends its Fetch API requests to `http://localhost:4000/api`. To change that address, create `frontend/.env` with `VITE_API_URL=http://your-api-host/api` and restart Vite.

## Demo sign-in

The schema creates a member with membership ID `BW-1001`. Sign in with password `reader123`, or change `DEMO_PASSWORD` in the backend `.env`. This is a simple coursework demonstration, not production authentication: the demo password is shared through server configuration and the API does not issue sessions or tokens. Do not use it for real accounts.

## What the app demonstrates

- **Dashboard:** total titles and copies, registered members, low-stock books (fewer than two), and recent activity.
- **Books:** create, list, search, edit, and delete books. ISBN values are unique.
- **Transactions:** record a borrow, return, restock, or stock adjustment. A borrow reduces available copies; a return or restock increases them. The backend uses a database transaction and locks the book row so concurrent stock updates cannot silently over-borrow.
- **Members:** add, list, edit, and delete members; demonstrate a login form.
- **Navigation and forms:** React Router pages, reusable React components, hooks (`useState`, `useEffect`, `useMemo`, `useCallback`), controlled inputs, and browser-side required-field checks.
- **Backend:** Express, `express.json()`, CORS, parameterized MySQL queries, and REST routes under `/api`.

## REST API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/books` | List books |
| POST | `/api/books` | Add a book |
| PUT | `/api/books/:id` | Update a book |
| DELETE | `/api/books/:id` | Delete a book with no transaction history |
| GET | `/api/users` | List members |
| POST | `/api/users` | Add a member |
| PUT | `/api/users/:id` | Update a member |
| DELETE | `/api/users/:id` | Delete a member; transaction history remains with no member attached |
| POST | `/api/users/login` | Demonstration sign-in |
| GET | `/api/transactions` | List transaction history |
| POST | `/api/transactions` | Record stock movement and update book stock |
| GET | `/api/health` | Check API and database connection |

Books with transaction history cannot be deleted; this preserves the record of what happened. Deleting a member keeps their past transactions and removes the member link.

## Troubleshooting

- **Database connection error:** make sure MySQL is running, the database script was run, and the backend `.env` credentials are correct.
- **Fetch/CORS error:** keep the frontend on the configured `FRONTEND_URL` (default `http://localhost:5173`) and the backend on port 4000, or update the environment values and restart both applications.
- **ISBN or membership ID conflict:** these fields are unique in the database; choose a value that has not already been used.

## Upload the project to GitHub

The GitHub repository must contain the project root, including both `frontend/` and `backend/`. From this folder, create a new repository on GitHub (for example, `bookwell-library`) and then run:

```bash
git init
git add README.md .gitignore frontend backend
git commit -m "Build library management system"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with the URL of your own new repository. Never upload `.env` or real database passwords. The provided `.gitignore` files exclude local secrets and installed packages.

## A guided way to understand the code

1. Start with `frontend/src/api.js`: it shows how `fetch()` sends requests and reports API errors.
2. Read `frontend/src/App.jsx`: it contains the four pages and the React hooks that load and update page data.
3. Compare a frontend action such as saving a book with `backend/src/routes/books.js`: the page sends JSON, and Express validates and saves it.
4. Read `backend/database/schema.sql` to see how books, members, and transactions are related.
5. Follow a borrow through `backend/src/routes/transactions.js`: Express checks the stock, updates the book and saves the history row together.

Before submission, run the app on your own computer, add a few example records, and make sure you can explain the pages, API calls, database tables, and stock rules.
