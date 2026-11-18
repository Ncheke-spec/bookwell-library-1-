import { useEffect, useState } from 'react';

const empty = { title: '', author: '', genre: '', isbn: '', quantity: 1 };
export default function BookForm({ initial = empty, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({ ...empty, ...initial });
  useEffect(() => setForm({ ...empty, ...initial }), [initial]);
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  function submit(event) { event.preventDefault(); onSubmit({ ...form, quantity: Number(form.quantity) }); }
  return <form className="form-grid" onSubmit={submit}>
    <label className="wide">Book title<input name="title" value={form.title} onChange={change} required maxLength="180" placeholder="e.g. The Midnight Library" /></label>
    <label>Author<input name="author" value={form.author} onChange={change} required maxLength="140" placeholder="Author name" /></label>
    <label>Genre<input name="genre" value={form.genre} onChange={change} required maxLength="80" placeholder="e.g. Fiction" /></label>
    <label>ISBN<input name="isbn" value={form.isbn} onChange={change} required maxLength="30" placeholder="978…" /></label>
    <label>Copies in stock<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={change} required /></label>
    <div className="form-actions wide"><button className="button" type="button" onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save book'}</button></div>
  </form>;
}
