import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import BookList from './components/BookList.jsx';
import BookForm from './components/BookForm.jsx';
import Notice from './components/Notice.jsx';
import { getBooks, getTransactions, getUsers, request } from './api.js';

function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function StatCard({ label, value, detail, icon, tone = '' }) { return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>; }
function useResource(loader) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => { setLoading(true); try { setData(await loader()); setError(''); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [loader]);
  useEffect(() => { refresh(); }, [refresh]); return { data, loading, error, refresh, setError };
}
const booksLoader = () => getBooks(); const usersLoader = () => getUsers(); const txLoader = () => getTransactions();

function Dashboard() {
  const books = useResource(booksLoader); const users = useResource(usersLoader); const tx = useResource(txLoader);
  const totalCopies = books.data.reduce((sum, book) => sum + Number(book.quantity), 0);
  const lowStock = books.data.filter(book => Number(book.quantity) < 2);
  const recent = tx.data.slice(0, 5);
  return <>
    <PageHeading eyebrow="TUESDAY, NOVEMBER 18" title="A good day to read something." description="Here’s what’s happening at your library today." action={<span className="live-pill"><i /> All systems ready</span>} />
    <div className="welcome-banner"><div><span className="banner-kicker">YOUR LIBRARY, AT A GLANCE</span><h2>A little knowledge goes<br />a long way.</h2><p>Keep your shelves in order and your community reading.</p></div><div className="banner-art"><div className="sun" /><div className="book-stack"><span /><span /><span /><span /></div><div className="plant">♧</div></div></div>
    <div className="stats-grid"><StatCard label="TITLES ON THE SHELF" value={books.loading ? '—' : books.data.length} detail="Unique books in your collection" icon="▤" /><StatCard label="COPIES AVAILABLE" value={books.loading ? '—' : totalCopies} detail="Ready for your readers" icon="↗" tone="peach" /><StatCard label="REGISTERED MEMBERS" value={users.loading ? '—' : users.data.length} detail="Part of your community" icon="♙" tone="lilac" /><StatCard label="NEED A RESTOCK" value={books.loading ? '—' : lowStock.length} detail="Titles with fewer than 2 copies" icon="!" tone="yellow" /></div>
    <div className="dashboard-columns"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">KEEP AN EYE ON</div><h2>Running low</h2></div><span className="small-count">{lowStock.length} titles</span></div>{books.error ? <Notice error={books.error} /> : <BookList books={lowStock.slice(0, 4)} compact />}</section>
    <section className="panel"><div className="panel-heading"><div><div className="eyebrow">THE LATEST</div><h2>Recent activity</h2></div><span className="small-count">{tx.data.length} total</span></div>{tx.error ? <Notice error={tx.error} /> : recent.length ? <div className="activity-list">{recent.map(item => <div className="activity-row" key={item.id}><span className={item.type === 'borrow' ? 'activity-icon borrow' : 'activity-icon'}>{item.type === 'borrow' ? '↗' : '+'}</span><div><strong>{item.type === 'borrow' ? 'Borrowed' : item.type === 'return' ? 'Returned' : 'Stock added'}</strong><small>{item.bookTitle} · {item.userName || 'Library desk'}</small></div><span className="activity-date">{new Date(item.createdAt).toLocaleDateString()}</span></div>)}</div> : <div className="empty-state">Transactions will appear here.</div>}</section></div>
  </>;
}

function BooksPage() {
  const { data: books, loading, error, refresh } = useResource(booksLoader); const [query, setQuery] = useState(''); const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState({});
  const filtered = useMemo(() => books.filter(b => `${b.title} ${b.author} ${b.genre} ${b.isbn}`.toLowerCase().includes(query.toLowerCase())), [books, query]);
  async function save(form) { setBusy(true); try { await request(editing ? `/books/${editing.id}` : '/books', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) }); setShowForm(false); setEditing(null); setNotice({ success: editing ? 'Book details updated.' : 'Book added to the collection.' }); await refresh(); } catch (e) { setNotice({ error: e.message }); } finally { setBusy(false); } }
  async function remove(book) { if (!window.confirm(`Delete “${book.title}”?`)) return; try { await request(`/books/${book.id}`, { method: 'DELETE' }); setNotice({ success: 'Book deleted.' }); refresh(); } catch (e) { setNotice({ error: e.message }); } }
  function edit(book) { setEditing(book); setShowForm(true); }
  return <><PageHeading eyebrow="THE COLLECTION" title="Books" description="Every story on your shelves, all in one place." action={<button className="button primary" onClick={() => { setEditing(null); setShowForm(true); }}>＋ &nbsp; Add a book</button>} /><Notice {...notice} />
    {showForm && <section className="panel form-panel"><div className="panel-heading"><div><div className="eyebrow">COLLECTION DETAILS</div><h2>{editing ? 'Edit this book' : 'Add to the collection'}</h2></div></div><BookForm initial={editing || undefined} onSubmit={save} onCancel={() => { setShowForm(false); setEditing(null); }} busy={busy} /></section>}
    <section className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR SHELVES</div><h2>All books <span className="inline-count">{books.length}</span></h2></div><div className="search-box"><span>⌕</span><input aria-label="Search books" placeholder="Search books…" value={query} onChange={e => setQuery(e.target.value)} /></div></div>{error ? <Notice error={error} /> : loading ? <div className="empty-state">Loading books…</div> : <BookList books={filtered} onEdit={edit} onDelete={remove} />}</section>
  </>;
}

function TransactionsPage() {
  const books = useResource(booksLoader); const users = useResource(usersLoader); const { data: transactions, loading, error, refresh } = useResource(txLoader); const [form, setForm] = useState({ bookId: '', userId: '', type: 'borrow', quantity: 1, note: '' }); const [notice, setNotice] = useState({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!form.bookId && books.data.length) setForm(current => ({ ...current, bookId: String(books.data[0].id) })); if (!form.userId && users.data.length) setForm(current => ({ ...current, userId: String(users.data[0].id) })); }, [books.data, users.data]);
  async function submit(e) { e.preventDefault(); setBusy(true); try { await request('/transactions', { method: 'POST', body: JSON.stringify({ ...form, quantity: Number(form.quantity), userId: form.userId || null }) }); setNotice({ success: 'The stock transaction was recorded.' }); setForm(current => ({ ...current, note: '' })); refresh(); books.refresh(); } catch (err) { setNotice({ error: err.message }); } finally { setBusy(false); } }
  return <>
    <PageHeading eyebrow="SHELF MOVEMENT" title="Transactions" description="Record new arrivals, borrows and returns." />
    <Notice {...notice} />
    <div className="transaction-layout">
      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">MAKE A RECORD</div><h2>Stock movement</h2></div></div>
        <form className="form-stack" onSubmit={submit}>
          <label>What happened?<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="borrow">Book borrowed (deduct stock)</option><option value="return">Book returned (add stock)</option><option value="restock">New stock arrived (add stock)</option><option value="adjustment">Stock adjustment</option>
          </select></label>
          <label>Choose a book<select required value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })}>
            <option value="">Select a book</option>{books.data.map(book => <option key={book.id} value={book.id}>{book.title} ({book.quantity} available)</option>)}
          </select></label>
          <label>Member <span className="optional">(optional for stock arrivals)</span><select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
            <option value="">Library desk / no member</option>{users.data.map(user => <option key={user.id} value={user.id}>{user.name} · {user.membershipId}</option>)}
          </select></label>
          <div className="two-fields">
            <label>{form.type === 'adjustment' ? 'Set available copies to' : 'Number of copies'}<input type="number" min={form.type === 'adjustment' ? '0' : '1'} step="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label>
            <label>Note <span className="optional">(optional)</span><input value={form.note} maxLength="255" onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Short note" /></label>
          </div>
          <button disabled={busy || !books.data.length} className="button primary">{busy ? 'Recording…' : 'Record transaction'}</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">THE PAPER TRAIL</div><h2>History <span className="inline-count">{transactions.length}</span></h2></div></div>
        {error ? <Notice error={error} /> : loading ? <div className="empty-state">Loading transactions…</div> : transactions.length ? <div className="activity-list large">{transactions.map(item => <div className="activity-row" key={item.id}><span className={item.type === 'borrow' ? 'activity-icon borrow' : 'activity-icon'}>{item.type === 'borrow' ? '↗' : '+'}</span><div><strong>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} · {item.quantity} {item.quantity === 1 ? 'copy' : 'copies'}</strong><small>{item.bookTitle} · {item.userName || 'Library desk'}{item.note ? ` · ${item.note}` : ''}</small></div><span className="activity-date">{new Date(item.createdAt).toLocaleString()}</span></div>)}</div> : <div className="empty-state">No transactions have been recorded.</div>}
      </section>
    </div>
  </>;
}

function UsersPage() {
  const { data: users, loading, error, refresh } = useResource(usersLoader); const [form, setForm] = useState({ name: '', membershipId: '', role: 'member', email: '' }); const [editing, setEditing] = useState(null); const [login, setLogin] = useState({ membershipId: '', password: '' }); const [notice, setNotice] = useState({}); const [busy, setBusy] = useState(false); const [session, setSession] = useState(null);
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function save(e) { e.preventDefault(); setBusy(true); try { await request(editing ? `/users/${editing.id}` : '/users', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) }); setNotice({ success: editing ? 'Member details updated.' : 'Member added.' }); setForm({ name: '', membershipId: '', role: 'member', email: '' }); setEditing(null); refresh(); } catch (err) { setNotice({ error: err.message }); } finally { setBusy(false); } }
  async function remove(user) { if (!window.confirm(`Delete member “${user.name}”?`)) return; try { await request(`/users/${user.id}`, { method: 'DELETE' }); setNotice({ success: 'Member deleted.' }); refresh(); } catch (err) { setNotice({ error: err.message }); } }
  async function signIn(e) { e.preventDefault(); try { const data = await request('/users/login', { method: 'POST', body: JSON.stringify(login) }); setSession(data.user); setNotice({ success: `Welcome, ${data.user.name}. This demo sign-in is for coursework only.` }); } catch (err) { setNotice({ error: err.message }); } }
  return <><PageHeading eyebrow="YOUR READERS" title="Members" description="Welcome your community and keep their details up to date." /><Notice {...notice} /><div className="users-layout"><section className="panel login-panel"><div className="panel-heading"><div><div className="eyebrow">MEMBER ACCESS</div><h2>Sign in</h2></div></div>{session ? <div className="signed-in"><span className="avatar">{session.name.slice(0, 1)}</span><p>Signed in as <strong>{session.name}</strong><br /><small>{session.role} · {session.membershipId}</small></p><button className="text-button" onClick={() => setSession(null)}>Sign out</button></div> : <form className="form-stack" onSubmit={signIn}><label>Membership ID<input required value={login.membershipId} onChange={e => setLogin({ ...login, membershipId: e.target.value })} placeholder="e.g. BW-1001" /></label><label>Password<input required type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} placeholder="Enter your password" /></label><p className="helper-text">Demo sign-in checks the membership ID. Set the demo password in the README instructions.</p><button className="button primary">Sign in</button></form>}</section>
    <section className="panel"><div className="panel-heading"><div><div className="eyebrow">ADMIN DESK</div><h2>{editing ? 'Update member' : 'Add a member'}</h2></div></div><form className="form-stack" onSubmit={save}><label>Full name<input name="name" required maxLength="120" value={form.name} onChange={change} placeholder="Reader’s name" /></label><label>Membership ID<input name="membershipId" required maxLength="40" value={form.membershipId} onChange={change} placeholder="e.g. BW-1042" /></label><label>Email address <span className="optional">(optional)</span><input name="email" type="email" maxLength="160" value={form.email} onChange={change} placeholder="reader@example.com" /></label><label>Role<select name="role" value={form.role} onChange={change}><option value="member">Member</option><option value="admin">Administrator</option></select></label><div className="form-actions"><button type="button" className="button" onClick={() => { setEditing(null); setForm({ name: '', membershipId: '', role: 'member', email: '' }); }}>Clear</button><button className="button primary" disabled={busy}>{editing ? 'Update member' : 'Add member'}</button></div></form></section></div>
    <section className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">THE COMMUNITY</div><h2>All members <span className="inline-count">{users.length}</span></h2></div></div>{error ? <Notice error={error} /> : loading ? <div className="empty-state">Loading members…</div> : users.length ? <div className="table-wrap"><table><thead><tr><th>MEMBER</th><th>MEMBERSHIP ID</th><th>EMAIL</th><th>ROLE</th><th></th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><div className="book-cell"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><strong>{user.name}</strong></div></td><td>{user.membershipId}</td><td className="muted-text">{user.email || '—'}</td><td><span className="genre-tag">{user.role}</span></td><td className="row-actions"><button className="text-button" onClick={() => { setEditing(user); setForm({ name: user.name, membershipId: user.membershipId, role: user.role, email: user.email || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button><button className="text-button danger-text" onClick={() => remove(user)}>Delete</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No members have been added.</div>}</section>
  </>;
}

export default function App() { return <Routes><Route element={<Layout />}><Route index element={<Dashboard />} /><Route path="books" element={<BooksPage />} /><Route path="transactions" element={<TransactionsPage />} /><Route path="users" element={<UsersPage />} /><Route path="*" element={<Dashboard />} /></Route></Routes>; }
