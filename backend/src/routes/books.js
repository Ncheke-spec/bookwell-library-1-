import { Router } from 'express';
import pool from '../db.js';
import { asyncRoute, isDuplicate, validId } from '../helpers.js';

const router = Router();
const fields = ['title', 'author', 'genre', 'isbn'];
function clean(body) {
  const values = Object.fromEntries(fields.map(key => [key, String(body[key] ?? '').trim()]));
  const quantity = Number(body.quantity);
  if (fields.some(key => !values[key])) return { error: 'Title, author, genre and ISBN are required.' };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: 'Quantity must be a whole number of zero or more.' };
  return { values, quantity };
}

router.get('/', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, title, author, genre, isbn, quantity, created_at AS createdAt FROM books ORDER BY title');
  res.json(rows);
}));

router.post('/', asyncRoute(async (req, res) => {
  const { values, quantity, error } = clean(req.body);
  if (error) return res.status(400).json({ error });
  const [result] = await pool.execute('INSERT INTO books (title, author, genre, isbn, quantity) VALUES (?, ?, ?, ?, ?)', [...Object.values(values), quantity]);
  const [rows] = await pool.execute('SELECT id, title, author, genre, isbn, quantity FROM books WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}));

router.put('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Book ID must be a positive number.' });
  const { values, quantity, error } = clean(req.body);
  if (error) return res.status(400).json({ error });
  const [result] = await pool.execute('UPDATE books SET title = ?, author = ?, genre = ?, isbn = ?, quantity = ? WHERE id = ?', [...Object.values(values), quantity, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Book not found.' });
  const [rows] = await pool.execute('SELECT id, title, author, genre, isbn, quantity FROM books WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Book ID must be a positive number.' });
  try {
    const [result] = await pool.execute('DELETE FROM books WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book deleted.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'This book has transaction history, so it cannot be deleted.' });
    throw error;
  }
}));

router.use((error, _req, res, next) => {
  if (isDuplicate(error)) return res.status(409).json({ error: 'A book with that ISBN already exists.' });
  next(error);
});

export default router;
