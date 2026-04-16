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
    borderRadius: '12px', padding: '40px 48px', width: '400px'
  },
  title: { color: '#00ff99', fontSize: '26px', fontWeight: 'bold', textAlign: 'center', marginBottom: '6px' },
  sub: { color: '#60606080', fontSize: '13px', textAlign: 'center', marginBottom: '28px' },
  label: { display: 'block', color: '#a0a0c0', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' },
  input: {
    width: '100%', background: '#070710', border: '1px solid #00ff9933',
    borderRadius: '6px', color: '#e0e0e0', padding: '10px 14px',
    fontSize: '14px', outline: 'none', marginBottom: '18px',
    fontFamily: 'Courier New, monospace'
  },
  btn: {
    width: '100%', background: '#00ff9922', border: '1px solid #00ff9966',
    color: '#00ff99', padding: '12px', borderRadius: '8px',
    fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '2px', marginTop: '8px'
  },
  error: { color: '#ff3355', fontSize: '13px', marginBottom: '14px', textAlign: 'center' },
  link: { color: '#00ff9988', fontSize: '13px', textAlign: 'center', marginTop: '18px', display: 'block' }
};

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');
  const { register, authError, loading } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch {}
  };

  const error = localError || authError;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>⬡ CREATE ACCOUNT</div>
        <div style={s.sub}>Join the underground network</div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Hacker Alias</label>
          <input style={s.input} value={form.username} onChange={set('username')}
            placeholder="ghost_zero" required minLength={3} />
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={form.email} onChange={set('email')} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={form.password} onChange={set('password')} required minLength={6} />
          <label style={s.label}>Confirm Password</label>
          <input style={s.input} type="password" value={form.confirm} onChange={set('confirm')} required />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'CREATING...' : 'INITIALIZE AGENT'}
          </button>
        </form>
        <Link to="/login" style={s.link}>Already have access? Log in →</Link>
      </div>
    </div>
  );
}
