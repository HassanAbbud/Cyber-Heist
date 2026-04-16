import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const ME = gql`query Me { me { username level xp } }`;

const styles = {
  nav: {
    background: '#0d0d1a',
    borderBottom: '1px solid #00ff9944',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
    color: '#00ff99',
    fontWeight: 'bold',
    fontSize: '18px',
    textDecoration: 'none',
    letterSpacing: '2px'
  },
  links: { display: 'flex', gap: '24px', alignItems: 'center' },
  link: { color: '#a0a0c0', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' },
  badge: {
    background: '#00ff9922',
    border: '1px solid #00ff9966',
    color: '#00ff99',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px'
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #ff335566',
    color: '#ff3355',
    padding: '4px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const { data } = useQuery(ME, { skip: !localStorage.getItem('cyberheist_token') });
  const user = data?.me;

  const logout = () => {
    localStorage.removeItem('cyberheist_token');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>⬡ CYBER HEIST</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Missions</Link>
        <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
        <Link to="/profile" style={styles.link}>Profile</Link>
        {user && (
          <span style={styles.badge}>
            LVL {user.level} · {user.xp} XP
          </span>
        )}
        {user && (
          <span style={{ color: '#a0a0c0', fontSize: '14px' }}>
            {user.username}
          </span>
        )}
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
