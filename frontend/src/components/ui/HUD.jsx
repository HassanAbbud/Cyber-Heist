import React from 'react';

const s = {
  hud: {
    position: 'fixed', top: 0, left: 0, right: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '16px 24px', pointerEvents: 'none', zIndex: 50,
    fontFamily: 'Courier New, monospace'
  },
  panel: {
    background: 'rgba(0,0,0,0.75)',
    border: '1px solid #00ff9944',
    borderRadius: '8px',
    padding: '10px 16px',
    minWidth: '140px'
  },
  label: { color: '#00ff9988', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' },
  value: { color: '#00ff99', fontSize: '22px', fontWeight: 'bold', lineHeight: 1.2 },
  detBar: { width: '100%', height: '6px', background: '#1a1a2e', borderRadius: '3px', marginTop: '6px' },
  detFill: (pct) => ({
    height: '100%',
    borderRadius: '3px',
    width: `${pct}%`,
    background: pct < 50 ? '#00ff99' : pct < 80 ? '#ffaa00' : '#ff3355',
    transition: 'width 0.4s, background 0.4s'
  })
};

export default function HUD({ score, detectionLevel, missionName, timeElapsed }) {
  const mins = String(Math.floor(timeElapsed / 60)).padStart(2, '0');
  const secs = String(timeElapsed % 60).padStart(2, '0');

  return (
    <div style={s.hud}>
      {/* Score */}
      <div style={s.panel}>
        <div style={s.label}>Score</div>
        <div style={s.value}>{score.toLocaleString()}</div>
      </div>

      {/* Mission name + timer */}
      <div style={{ ...s.panel, textAlign: 'center' }}>
        <div style={s.label}>Mission</div>
        <div style={{ color: '#c0c0e0', fontSize: '13px', marginBottom: '4px' }}>{missionName}</div>
        <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>{mins}:{secs}</div>
      </div>

      {/* Detection level */}
      <div style={s.panel}>
        <div style={s.label}>Detection {detectionLevel}%</div>
        <div style={s.detBar}>
          <div style={s.detFill(detectionLevel)} />
        </div>
        <div style={{ color: detectionLevel < 50 ? '#00ff99' : detectionLevel < 80 ? '#ffaa00' : '#ff3355', fontSize: '11px', marginTop: '4px' }}>
          {detectionLevel < 50 ? 'UNDETECTED' : detectionLevel < 80 ? 'SUSPICIOUS' : 'CRITICAL'}
        </div>
      </div>
    </div>
  );
}
