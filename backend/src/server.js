import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';
import books from './routes/books.js';
import transactions from './routes/transactions.js';
import users from './routes/users.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', async (_req, res, next) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (error) { next(error); }
});
app.use('/api/books', books);
app.use('/api/transactions', transactions);
app.use('/api/users', users);
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong on the server. Check the backend terminal for details.' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Bookwell API listening at http://localhost:${port}/api`));
