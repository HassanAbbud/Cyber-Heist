import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import CyberDefenseGame from '../components/game/CyberDefenseGame';
import GameOverScreen from '../components/game/GameOverScreen';
import { START_SESSION, COMPLETE_SESSION } from '../graphql/operations';

export default function GamePage() {
  const { missionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mission = location.state?.mission || { id: missionId, name: 'Defense Grid' };

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [levelUpResult, setLevelUpResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const startTime = useRef(Date.now());

  const [startSession] = useMutation(START_SESSION);
  const [completeSession] = useMutation(COMPLETE_SESSION);

  useEffect(() => {
    startSession({ variables: { missionId: mission.id, missionName: mission.name } })
      .then(({ data }) => setSessionId(data.startGameSession.id))
      .catch(() => {});
  }, []);

  const handleGameOver = async (finalScore, victory = false) => {
    setGameOver(true);
    setVictory(victory);
    if (sessionId) {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      try {
        const { data } = await completeSession({ variables: { sessionId, finalScore, timeSpent } });
        setLevelUpResult(data.completeGameSession);
      } catch (e) {}
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f', display: 'flex',
      flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px', background: '#0d0d1a', borderBottom: '1px solid #00ff9922',
        fontFamily: 'Courier New', flexShrink: 0 }}>
        <span style={{ color: '#00ff99', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
          ⬡ {mission.name.toUpperCase()}
        </span>
        <span style={{ color: '#606080', fontSize: '12px' }}>
          Score: {score.toLocaleString()}
        </span>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: '1px solid #ff335544', color: '#ff3355',
            padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
          ✕ Abort
        </button>
      </div>

      {/* Game fills remaining space */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CyberDefenseGame
          missionId={mission.id}
          onScore={setScore}
          onLivesChange={setLives}
          onGameOver={handleGameOver}
        />
      </div>

      {gameOver && (
        <GameOverScreen
          success={lives > 0}
          victory={victory}
          score={score}
          levelUpResult={levelUpResult}
          missionName={mission.name}
        />
      )}
    </div>
  );
}
