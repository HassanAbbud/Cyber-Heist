import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ME, MY_SCORES, MY_SESSIONS, UPDATE_AVATAR } from '../graphql/operations';

const AVATARS = ['hacker_default', 'ghost_zero', 'phantom', 'overlord', 'ghost'];

const s = {
  page: { minHeight: 'calc(100vh - 56px)', background: '#0a0a0f', padding: '32px 40px' },
  grid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px' },
  card: { background: '#0d0d1a', border: '1px solid #ffffff11', borderRadius: '10px', padding: '24px' },
  avatarBox: { textAlign: 'center', marginBottom: '20px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', background: '#00ff9922', border: '2px solid #00ff9966', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '32px' },
  username: { color: '#e0e0e0', fontSize: '20px', fontWeight: 'bold' },
  levelBadge: { display: 'inline-block', background: '#ffaa0022', border: '1px solid #ffaa0066', color: '#ffaa00', padding: '3px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '6px' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' },
  stat: { background: '#0a0a18', borderRadius: '8px', padding: '12px', textAlign: 'center' },
  statVal: { color: '#00ff99', fontSize: '20px', fontWeight: 'bold', fontFamily: 'Courier New' },
  statLbl: { color: '#606080', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' },
  sectionTitle: { color: '#a0a0c0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' },
  xpBar: { background: '#1a1a2e', borderRadius: '4px', height: '8px', marginTop: '8px', overflow: 'hidden' },
  xpFill: (pct) => ({ height: '100%', background: '#00ff99', borderRadius: '4px', width: `${pct}%`, transition: 'width 0.5s' }),
  achievBadge: { display: 'inline-block', margin: '4px', background: '#8855ff22', border: '1px solid #8855ff44', color: '#8855ff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' },
  missionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #ffffff08' },
  avatarGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' },
  avatarOption: (selected) => ({ width: '44px', height: '44px', borderRadius: '50%', background: selected ? '#00ff9922' : '#0a0a18', border: `2px solid ${selected ? '#00ff99' : '#ffffff22'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' })
};

const AVATAR_EMOJI = { hacker_default: '🎭', ghost_zero: '👻', phantom: '🕵️', overlord: '🤖', ghost: '💀' };

export default function ProfilePage() {
  const { data: meData } = useQuery(ME);
  const { data: scoresData } = useQuery(MY_SCORES);
  const { data: sessionsData } = useQuery(MY_SESSIONS);
  const [updateAvatar] = useMutation(UPDATE_AVATAR, { refetchQueries: [{ query: ME }] });

  const user = meData?.me;
  const scores = scoresData?.myScores || [];
  const sessions = sessionsData?.myGameSessions || [];

  if (!user) return <div style={{ ...s.page, color: '#00ff9966', fontFamily: 'Courier New' }}>Loading profile...</div>;

  const xpPct = Math.min(100, (user.xp / (user.level * 100)) * 100);
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  return (
    <div style={s.page}>
      <div style={s.grid}>
        {/* Left panel - profile */}
        <div>
          <div style={s.card}>
            <div style={s.avatarBox}>
              <div style={s.avatar}>{AVATAR_EMOJI[user.avatar] || '🎭'}</div>
              <div style={s.username}>{user.username}</div>
              <div style={s.levelBadge}>LEVEL {user.level}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#606080', fontSize: '12px' }}>XP Progress</span>
                <span style={{ color: '#00ff99', fontSize: '12px' }}>{user.xp} / {user.level * 100}</span>
              </div>
              <div style={s.xpBar}><div style={s.xpFill(xpPct)} /></div>
            </div>

            <div style={s.statGrid}>
              <div style={s.stat}>
                <div style={s.statVal}>{completedSessions.length}</div>
                <div style={s.statLbl}>Heists</div>
              </div>
              <div style={s.stat}>
                <div style={s.statVal}>{totalScore.toLocaleString()}</div>
                <div style={s.statLbl}>Total Score</div>
              </div>
              <div style={s.stat}>
                <div style={s.statVal}>{user.credits}</div>
                <div style={s.statLbl}>Credits</div>
              </div>
              <div style={s.stat}>
                <div style={s.statVal}>{user.achievements.length}</div>
                <div style={s.statLbl}>Badges</div>
              </div>
            </div>
          </div>

          {/* Avatar selector */}
          <div style={{ ...s.card, marginTop: '16px' }}>
            <div style={s.sectionTitle}>Avatar</div>
            <div style={s.avatarGrid}>
              {AVATARS.map(a => (
                <div key={a} style={s.avatarOption(user.avatar === a)}
                  onClick={() => updateAvatar({ variables: { avatar: a } })}
                  title={a.replace(/_/g, ' ')}>
                  {AVATAR_EMOJI[a] || '👤'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Achievements */}
          <div style={s.card}>
            <div style={s.sectionTitle}>Achievements</div>
            {user.achievements.length === 0
              ? <div style={{ color: '#404060', fontSize: '13px' }}>Complete missions and challenges to earn badges.</div>
              : user.achievements.map(a => <span key={a} style={s.achievBadge}>{a.replace(/_/g, ' ')}</span>)
            }
          </div>

          {/* Mission history */}
          <div style={s.card}>
            <div style={s.sectionTitle}>Mission History</div>
            {sessions.length === 0
              ? <div style={{ color: '#404060', fontSize: '13px' }}>No missions played yet.</div>
              : sessions.slice(0, 8).map(session => (
                <div key={session.id} style={s.missionRow}>
                  <div>
                    <div style={{ color: '#c0c0e0', fontSize: '14px' }}>{session.missionName}</div>
                    <div style={{ color: '#606080', fontSize: '12px' }}>
                      {new Date(Number(session.completedAt || session.startedAt)).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#00ff99', fontSize: '14px', fontFamily: 'Courier New' }}>{session.score.toLocaleString()}</div>
                    <div style={{ color: session.status === 'completed' ? '#00ff9988' : '#ff335588', fontSize: '11px', textTransform: 'uppercase' }}>
                      {session.status}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
