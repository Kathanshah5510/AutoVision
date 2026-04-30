import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/navbar.css';
import logoDark  from '../assets/logo-dark.png';
import logoLight from '../assets/logo-light.png';

export default function Navbar({ userData, onNewScan, onLogout, onEditProfile }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = userData?.fullname
    ? userData.fullname.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav>
      {/* ── Left: Logo + Breadcrumb ── */}
      <div className="nav-left">
        <div className="nav-logo">
          <img src={logoDark}  alt="AutoVision Logo" className="logo-dark" />
          <img src={logoLight} alt="AutoVision Logo" className="logo-light" />
        </div>
        <div className="breadcrumb">
          <span className="bc-dim">Home</span>
          <span className="sep">›</span>
          <span className="bc-dim">Inspect</span>
          <span className="sep">›</span>
          <span>Result</span>
        </div>
      </div>

      {/* ── Right: actions (collapses on mobile) ── */}
      <div className={`nav-right${menuOpen ? ' active' : ''}`} id="navMenu">
        {userData && (
          <div
            className="user-badge"
            id="user-badge"
            onClick={() => { onEditProfile(); setMenuOpen(false); }}
            role="button"
            tabIndex={0}
          >
            <div className="user-avatar">{initials}</div>
            <span className="user-name">{userData.fullname}</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          id="theme-toggle"
          onClick={toggleTheme}
          title="Toggle light/dark mode"
        >
          {/* Sun icon */}
          <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1"  x2="12" y2="3"  />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"   />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1"  y1="12" x2="3"  y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"  />
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
          </svg>
          {/* Moon icon */}
          <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <button className="btn-new"    onClick={() => { onNewScan();  setMenuOpen(false); }}>New Scan</button>
        <button className="btn-logout" onClick={() => { onLogout();   setMenuOpen(false); }}>Logout</button>
      </div>

      {/* Hamburger */}
      <button
        className="menu-toggle"
        id="menuToggle"
        onClick={() => setMenuOpen(v => !v)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
    </nav>
  );
}
