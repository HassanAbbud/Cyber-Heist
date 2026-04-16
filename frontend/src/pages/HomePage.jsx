import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ME, ACTIVE_CHALLENGES } from '../graphql/operations';

const MISSIONS = [
  {
    id: 'corp_breach',
    name: 'Corporate Breach',
    description: 'Infiltrate MegaCorp\'s mainframe. Steal the executive encryption keys.',
    difficulty: 'easy',
    xpReward: 200,
    color: '#00ff99'
  },
  {
    id: 'bank_heist',
    name: 'Digital Bank Heist',
    description: 'Bypass blockchain security at NeoBank. Transfer funds undetected.',
    difficulty: 'medium',
    xpReward: 400,
    color: '#ffaa00'
  },
  {
    id: 'gov_blackout',
    name: 'Government Blackout',
    description: 'Hack the power grid control system. Avoid military AI countermeasures.',
    difficulty: 'hard',
    xpReward: 800,
    color: '#ff3355'
  }
];

const DIFFICULTY_COLOR = { easy: '#00ff99', medium: '#ffaa00', hard: '#ff3355' };

const s = {
  page: { minHeight: 'calc(100vh - 56px)', background: '#0a0a0f', padding: '32px 40px' },
  header: { marginBottom: '32px' },
  title: { color: '#e0e0e0', fontSize: '24px', fontWeight: 'bold' },
  sub: { color: '#60608080', fontSize: '14px', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' },
  card: (color) => ({
    background: '#0d0d1a',
    border: `1px solid ${color}44`,
    borderRadius: '10px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.15s',
  }),
  missionName: (color) => ({ color, fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }),
  missionDesc: { color: '#a0a0b0', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  diffBadge: (diff) => ({
    background: `${DIFFICULTY_COLOR[diff]}22`,
    border: `1px solid ${DIFFICULTY_COLOR[diff]}66`,
    color: DIFFICULTY_COLOR[diff],
    padding: '2px 10px', borderRadius: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px'
  }),
  xp: { color: '#8080a0', fontSize: '12px' },
  sectionTitle: { color: '#a0a0c0', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
  challengeCard: {
    background: '#0d0d1a', border: '1px solid #8855ff44',
    borderRadius: '8px', padding: '16px 20px', marginBottom: '12px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  completeBtn: {
    background: '#8855ff22', border: '1px solid #8855ff66',
    color: '#8855ff', padding: '5px 14px', borderRadius: '6px',
    cursor: 'pointer', fontSize: '12px'
  },
  completedBadge: {
    color: '#00ff9988', fontSize: '12px', padding: '5px 14px',
    border: '1px solid #00ff9933', borderRadius: '6px'
  }
};

export default function HomePage() {
  const navigate = useNavigate();
  const { data: meData } = useQuery(ME);
  const { data: challengeData } = useQuery(ACTIVE_CHALLENGES);
  const user = meData?.me;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>
          Welcome back, {user?.username || '...'}
        </div>
        <div style={s.sub}>
          Level {user?.level || 1} · {user?.xp || 0} XP · {user?.credits || 0} Credits
        </div>
      </div>

      <div style={s.sectionTitle}>Active Missions</div>
      <div style={s.grid}>
        {MISSIONS.map(m => (
          <div
            key={m.id}
            style={s.card(m.color)}
            onClick={() => navigate(`/game/${m.id}`, { state: { mission: m } })}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + '99'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = m.color + '44'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={s.missionName(m.color)}>{m.name}</div>
            <div style={s.missionDesc}>{m.description}</div>
            <div style={s.row}>
              <span style={s.diffBadge(m.difficulty)}>{m.difficulty}</span>
              <span style={s.xp}>+{m.xpReward} XP</span>
            </div>
          </div>
        ))}
      </div>

      {challengeData?.activeChallenges?.length > 0 && (
        <>
          <div style={s.sectionTitle}>Daily Challenges</div>
          {challengeData.activeChallenges.map(c => (
            <div key={c.id} style={s.challengeCard}>
              <div>
                <div style={{ color: '#c0c0e0', fontSize: '14px', fontWeight: 'bold' }}>{c.title}</div>
                <div style={{ color: '#808090', fontSize: '12px', marginTop: '2px' }}>
                  {c.description} · +{c.xpReward} XP
                </div>
              </div>
              {c.completedByMe
                ? <span style={s.completedBadge}>✓ Done</span>
                : <button style={s.completeBtn}>Claim</button>
              }
            </div>
          ))}
        </>
      )}
    </div>
  );
}
