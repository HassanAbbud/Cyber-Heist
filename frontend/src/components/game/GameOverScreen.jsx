import React from 'react';
import { useNavigate } from 'react-router-dom';

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300
  },
  card: {
    background: '#0d0d1a', border: '1px solid #00ff9966',
    borderRadius: '14px', padding: '48px', textAlign: 'center', width: '420px',
    fontFamily: 'Courier New, monospace'
  },
  icon: { fontSize: '48px', marginBottom: '16px' },
  title: { color: '#00ff99', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '8px' },
  subtitle: { color: '#a0a0c0', fontSize: '14px', marginBottom: '32px' },
  statRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 16px', background: '#0a0a18', borderRadius: '8px' },
  statLabel: { color: '#606080', fontSize: '13px' },
  statValue: { color: '#e0e0e0', fontSize: '14px', fontWeight: 'bold' },
  unlocks: { marginTop: '20px', marginBottom: '24px' },
  unlockTitle: { color: '#ffaa00', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
  unlockItem: {
    display: 'inline-block', margin: '4px',
    background: '#ffaa0022', border: '1px solid #ffaa0066',
    color: '#ffaa00', padding: '3px 10px', borderRadius: '12px', fontSize: '12px'
  },
  btn: {
    display: 'block', width: '100%',
    background: '#00ff9922', border: '1px solid #00ff9966',
    color: '#00ff99', padding: '13px', borderRadius: '8px',
    fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '2px', marginTop: '8px'
  },
  btnAlt: {
    background: 'none', border: '1px solid #ffffff22',
    color: '#606080'
  }
};

export default function GameOverScreen({ success, score, levelUpResult, missionName }) {
  const navigate = useNavigate();

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.icon}>{success ? '🏆' : '💀'}</div>
        <div style={s.title}>{success ? 'HEIST COMPLETE' : 'MISSION FAILED'}</div>
        <div style={s.subtitle}>{missionName}</div>

        <div style={s.statRow}>
          <span style={s.statLabel}>Final Score</span>
          <span style={s.statValue}>{score.toLocaleString()}</span>
        </div>
        {levelUpResult && (
          <>
            <div style={s.statRow}>
              <span style={s.statLabel}>XP Earned</span>
              <span style={{ ...s.statValue, color: '#00ff99' }}>+{score / 10 | 0} XP</span>
            </div>
            <div style={s.statRow}>
              <span style={s.statLabel}>Current Level</span>
              <span style={{ ...s.statValue, color: '#ffaa00' }}>LVL {levelUpResult.newLevel}</span>
            </div>
          </>
        )}

        {levelUpResult?.unlockedItems?.length > 0 && (
          <div style={s.unlocks}>
            <div style={s.unlockTitle}>🔓 Unlocked</div>
            {levelUpResult.unlockedItems.map(item => (
              <span key={item} style={s.unlockItem}>{item.replace(/_/g, ' ')}</span>
            ))}
          </div>
        )}

        <button style={s.btn} onClick={() => navigate('/')}>BACK TO MISSIONS</button>
        <button style={{ ...s.btn, ...s.btnAlt }} onClick={() => window.location.reload()}>
          RETRY MISSION
        </button>
      </div>
    </div>
  );
}
