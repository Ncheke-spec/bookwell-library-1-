import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Overview', icon: '⌂' },
  { to: '/books', label: 'Books', icon: '▤' },
  { to: '/transactions', label: 'Activity', icon: '↗' },
  { to: '/users', label: 'Members', icon: '♙' },
];

export default function Layout() {
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">b.</span><span>bookwell<small>COMMUNITY LIBRARY</small></span></a>
      <div className="nav-label">WORKSPACE</div>
      <nav>{links.map(link => <NavLink key={link.to} end={link.to === '/'} to={link.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><span className="nav-icon">{link.icon}</span>{link.label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="open-badge"><span className="dot" /> Library is open<small>Monday – Saturday · 9am–6pm</small></div><div className="user-chip"><span className="avatar">L</span><span>Library desk<small>Administrator</small></span><span className="more">···</span></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb">Bookwell <span>/</span> <b>Library workspace</b></div><div className="top-actions"><span className="today-label">✳ &nbsp; Your neighborhood library</span><span className="top-avatar">L</span></div></header><div className="content"><Outlet /></div></main>
  </div>;
}
