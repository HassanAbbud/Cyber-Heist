import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import CyberDefenseGame from '../components/game/CyberDefenseGame';
import GameOverScreen from '../components/game/GameOverScreen';
import { ME, START_SESSION, COMPLETE_SESSION } from '../graphql/operations';

const s = {
  page: { width: '100vw', height: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 20px', background: '#0d0d1a', borderBottom: '1px solid #00ff9922',
    fontFamily: 'Courier New, monospace', flexShrink: 0
  },
  missionTitle: { color: '#00ff99', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' },
  statPill: { background: '#0a0a18', border: '1px solid #ffffff11', borderRadius: '20px', padding: '4px 14px', color: '#c0c0e0', fontSize: '13px' },
  livesRed: { color: '#ff3355' },
  gameArea: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '8px' },
  sidebar: {
    width: '200px', flexShrink: 0, padding: '12px', background: '#0d0d1a',
    borderLeft: '1px solid #00ff9922', fontFamily: 'Courier New', fontSize: '13px',
    display: 'flex', flexDirection: 'column', gap: '10px'
  },
  helpBox: { background: '#0a0a18', border: '1px solid #ffffff11', borderRadius: '8px', padding: '12px', color: '#808090', lineHeight: 1.7, fontSize: '12px' },
  abortBtn: { background: 'none', border: '1px solid #ff335544', color: '#ff3355', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }
};

export default function GamePage() {
  const { missionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mission = location.state?.mission || { id: missionId, name: 'Defense Grid' };

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(10);
  const [credits, setCredits] = useState(200);
  const [gameOver, setGameOver] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [levelUpResult, setLevelUpResult] = useState(null);
  const startTime = useRef(Date.now());

  const [startSession] = useMutation(START_SESSION);
  const [completeSession] = useMutation(COMPLETE_SESSION);

  useEffect(() => {
    startSession({ variables: { missionId: mission.id, missionName: mission.name } })
      .then(({ data }) => setSessionId(data.startGameSession.id))
      .catch(() => {});
  }, []);

  const handleScore = (newScore) => setScore(newScore);
  const handleLivesChange = (newLives) => setLives(newLives);
  const handleSpend = (amount) => setCredits(c => Math.max(0, c - amount));

  const handleGameOver = async (finalScore) => {
    setGameOver(true);
    if (sessionId) {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      try {
        const { data } = await completeSession({ variables: { sessionId, finalScore, timeSpent } });
        setLevelUpResult(data.completeGameSession);
      } catch (e) {}
    }
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <span style={s.missionTitle}>⬡ {mission.name}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={s.statPill}>Score: {score.toLocaleString()}</span>
          <span style={{ ...s.statPill, ...(lives <= 3 ? s.livesRed : {}) }}>♥ {lives} lives</span>
          <span style={s.statPill}>⬡ {credits} credits</span>
        </div>
        <button style={s.abortBtn} onClick={() => navigate('/')}>✕ Abort</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={s.gameArea}>
          <CyberDefenseGame
            onScore={handleScore}
            onLivesChange={handleLivesChange}
            onGameOver={handleGameOver}
            onSpend={handleSpend}
            credits={credits}
          />
        </div>

        <div style={s.sidebar}>
          <div style={{ color: '#00ff99', fontWeight: 'bold', fontSize: '13px' }}>HOW TO PLAY</div>
          <div style={s.helpBox}>
            <b style={{ color: '#c0c0e0' }}>Click</b> any empty cell to place a tower (costs <span style={{ color: '#00ff99' }}>50 ⬡</span>).<br /><br />
            Towers auto-shoot enemies in range.<br /><br />
            Enemies follow the <span style={{ color: '#a0a0ff' }}>glowing path</span>.<br /><br />
            Kill enemies to earn credits back. Don't let 10 through!<br /><br />
            Click <span style={{ color: '#00ff99' }}>SEND WAVE</span> when ready.
          </div>
          <div style={{ color: '#606080', fontSize: '11px', lineHeight: 1.6 }}>
            <span style={{ color: '#00ff99' }}>Green</span> = can place<br />
            <span style={{ color: '#ff3355' }}>Red</span> = blocked<br />
            Hover a tower to see range.
          </div>
          <div style={{ marginTop: 'auto', color: '#404060', fontSize: '11px' }}>
            Waves get harder each round. Earn credits by killing enemies.
          </div>
        </div>
      </div>

      {gameOver && (
        <GameOverScreen
          success={lives > 0}
          score={score}
          levelUpResult={levelUpResult}
          missionName={mission.name}
        />
      )}
    </div>
  );
}
