import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { LEADERBOARD } from '../graphql/operations';

const MISSIONS = [
  { id: null,         name: 'All Missions' },
  { id: 'corp_breach', name: 'Corporate Breach' },
  { id: 'bank_heist',  name: 'Digital Bank Heist' },
  { id: 'gov_blackout', name: 'Government Blackout' }
];

const s = {
  page: { minHeight: 'calc(100vh - 56px)', background: '#0a0a0f', padding: '32px 40px' },
  title: { color: '#e0e0e0', fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' },
  sub: { color: '#60608080', fontSize: '14px', marginBottom: '28px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '28px' },
  tab: (active) => ({
    background: active ? '#00ff9922' : 'none',
    border: `1px solid ${active ? '#00ff9966' : '#ffffff22'}`,
    color: active ? '#00ff99' : '#808090',
    padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px'
  }),
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { color: '#606080', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #ffffff11' },
  tr: (i) => ({ background: i % 2 === 0 ? '#0d0d1a' : 'transparent' }),
  td: { padding: '12px 16px', fontSize: '14px', color: '#c0c0e0', borderBottom: '1px solid #ffffff08' },
  rank: (i) => ({
    color: i === 0 ? '#ffaa00' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#606080',
    fontWeight: 'bold', fontSize: '15px'
  }),
  username: { color: '#e0e0e0', fontWeight: 'bold' },
  score: { color: '#00ff99', fontWeight: 'bold', fontFamily: 'Courier New' }
};

export default function LeaderboardPage() {
  const [selectedMission, setSelectedMission] = useState(null);
  const { data, loading } = useQuery(LEADERBOARD, {
    variables: { missionId: selectedMission, limit: 20 }
  });

  const entries = data?.leaderboard || [];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div style={s.page}>
      <div style={s.title}>Leaderboard</div>
      <div style={s.sub}>Top hackers across all missions</div>

      <div style={s.tabs}>
        {MISSIONS.map(m => (
          <button key={m.id || 'all'} style={s.tab(selectedMission === m.id)}
            onClick={() => setSelectedMission(m.id)}>
            {m.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#00ff9966', fontFamily: 'Courier New' }}>Loading rankings...</div>
      ) : entries.length === 0 ? (
        <div style={{ color: '#606080', fontSize: '14px' }}>No scores yet. Be the first to complete a mission!</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Hacker</th>
              <th style={s.th}>Mission</th>
              <th style={s.th}>Score</th>
              <th style={s.th}>Time</th>
              <th style={s.th}>XP</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={entry.id} style={s.tr(i)}>
                <td style={s.td}><span style={s.rank(i)}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span></td>
                <td style={s.td}><span style={s.username}>{entry.username}</span></td>
                <td style={s.td}>{entry.missionName}</td>
                <td style={s.td}><span style={s.score}>{entry.score.toLocaleString()}</span></td>
                <td style={s.td}>{formatTime(entry.timeSpent)}</td>
                <td style={s.td}>+{entry.xpEarned} XP</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
