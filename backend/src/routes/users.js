import { Router } from 'express';
import pool from '../db.js';
import { asyncRoute, isDuplicate, validId } from '../helpers.js';

const router = Router();
function clean(body) {
  const name = String(body.name ?? '').trim();
  const membershipId = String(body.membershipId ?? '').trim();
  const email = String(body.email ?? '').trim() || null;
  const role = body.role === 'admin' ? 'admin' : body.role === 'member' || !body.role ? 'member' : null;
  if (!name || !membershipId || !role) return { error: 'Name, membership ID and a valid role are required.' };
  return { name, membershipId, email, role };
}

router.post('/login', asyncRoute(async (req, res) => {
  const membershipId = String(req.body.membershipId ?? '').trim();
  const password = String(req.body.password ?? '');
  if (!membershipId || !password) return res.status(400).json({ error: 'Membership ID and password are required.' });
  if (password !== (process.env.DEMO_PASSWORD || 'reader123')) return res.status(401).json({ error: 'Membership ID or password is incorrect.' });
  const [rows] = await pool.execute('SELECT id, name, membership_id AS membershipId, email, role FROM users WHERE membership_id = ?', [membershipId]);
  if (!rows.length) return res.status(401).json({ error: 'Membership ID or password is incorrect.' });
  res.json({ user: rows[0] });
}));

router.get('/', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, membership_id AS membershipId, email, role, created_at AS createdAt FROM users ORDER BY name');
  res.json(rows);
}));

router.post('/', asyncRoute(async (req, res) => {
  const { name, membershipId, email, role, error } = clean(req.body);
  if (error) return res.status(400).json({ error });
  const [result] = await pool.execute('INSERT INTO users (name, membership_id, email, role) VALUES (?, ?, ?, ?)', [name, membershipId, email, role]);
  res.status(201).json({ id: result.insertId, name, membershipId, email, role });
}));

router.put('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'User ID must be a positive number.' });
  const { name, membershipId, email, role, error } = clean(req.body);
  if (error) return res.status(400).json({ error });
  const [result] = await pool.execute('UPDATE users SET name = ?, membership_id = ?, email = ?, role = ? WHERE id = ?', [name, membershipId, email, role, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Member not found.' });
  res.json({ id: Number(req.params.id), name, membershipId, email, role });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'User ID must be a positive number.' });
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Member not found.' });
  res.json({ message: 'Member deleted.' });
}));

router.use((error, _req, res, next) => {
  if (isDuplicate(error)) return res.status(409).json({ error: 'That membership ID is already in use.' });
  next(error);
});

export default router;
