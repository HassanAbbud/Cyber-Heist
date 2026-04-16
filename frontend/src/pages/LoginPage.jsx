import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0a0a0f'
  },
  card: {
    background: '#0d0d1a', border: '1px solid #00ff9944',
    borderRadius: '12px', padding: '40px 48px', width: '380px'
  },
  title: { color: '#00ff99', fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' },
  sub: { color: '#60608080', fontSize: '13px', textAlign: 'center', marginBottom: '32px' },
  label: { display: 'block', color: '#a0a0c0', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' },
  input: {
    width: '100%', background: '#070710', border: '1px solid #00ff9933',
    borderRadius: '6px', color: '#e0e0e0', padding: '10px 14px',
    fontSize: '14px', outline: 'none', marginBottom: '20px',
    fontFamily: 'Courier New, monospace'
  },
  btn: {
    width: '100%', background: '#00ff9922', border: '1px solid #00ff9966',
    color: '#00ff99', padding: '12px', borderRadius: '8px',
    fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '2px', marginTop: '8px'
  },
  error: { color: '#ff3355', fontSize: '13px', marginBottom: '16px', textAlign: 'center' },
  link: { color: '#00ff9988', fontSize: '13px', textAlign: 'center', marginTop: '20px', display: 'block' }
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, authError, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {}
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>⬡ CYBER HEIST</div>
        <div style={s.sub}>2025 — Access Terminal</div>
        {authError && <div style={s.error}>{authError}</div>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)} required autoFocus />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'CONNECTING...' : 'JACK IN'}
          </button>
        </form>
        <Link to="/register" style={s.link}>
          No account? Register as a new hacker →
        </Link>
      </div>
    </div>
  );
}
