import { Router } from 'express';
import pool from '../db.js';
import { asyncRoute, validId } from '../helpers.js';

const router = Router();
const validTypes = ['borrow', 'return', 'restock', 'adjustment'];

router.get('/', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`SELECT t.id, t.book_id AS bookId, t.user_id AS userId, t.type, t.quantity, t.note, t.created_at AS createdAt,
    b.title AS bookTitle, u.name AS userName
    FROM transactions t JOIN books b ON b.id = t.book_id LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC, t.id DESC`);
  res.json(rows);
}));

router.post('/', asyncRoute(async (req, res) => {
  const bookId = Number(req.body.bookId);
  const userId = req.body.userId ? Number(req.body.userId) : null;
  const quantity = Number(req.body.quantity);
  const type = String(req.body.type ?? '');
  const note = String(req.body.note ?? '').trim().slice(0, 255) || null;
  if (!validId(bookId) || !Number.isInteger(quantity) || quantity < 1 || !validTypes.includes(type)) return res.status(400).json({ error: 'Choose a book, a valid transaction type and a whole number of at least one copy.' });
  if (userId !== null && !validId(userId)) return res.status(400).json({ error: 'Choose a valid member.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [books] = await connection.execute('SELECT id, quantity FROM books WHERE id = ? FOR UPDATE', [bookId]);
    if (!books.length) { await connection.rollback(); return res.status(404).json({ error: 'Book not found.' }); }
    if (userId !== null) {
      const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
      if (!users.length) { await connection.rollback(); return res.status(404).json({ error: 'Member not found.' }); }
    }
    let nextQuantity = Number(books[0].quantity);
    if (type === 'borrow') nextQuantity -= quantity;
    if (type === 'return' || type === 'restock') nextQuantity += quantity;
    if (type === 'adjustment') nextQuantity = quantity;
    if (nextQuantity < 0) { await connection.rollback(); return res.status(409).json({ error: 'There are not enough copies available for that borrow.' }); }
    await connection.execute('UPDATE books SET quantity = ? WHERE id = ?', [nextQuantity, bookId]);
    const [insert] = await connection.execute('INSERT INTO transactions (book_id, user_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)', [bookId, userId, type, quantity, note]);
    await connection.commit();
    res.status(201).json({ id: insert.insertId, bookId, userId, type, quantity, note, remaining: nextQuantity });
  } catch (error) {
    await connection.rollback(); throw error;
  } finally { connection.release(); }
}));

export default router;
