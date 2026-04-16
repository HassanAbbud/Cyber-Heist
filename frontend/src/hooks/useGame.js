import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { START_SESSION, UPDATE_SESSION, COMPLETE_SESSION } from '../graphql/operations';

export function useGame() {
  const [sessionId, setSessionId] = useState(null);
  const [score, setScore] = useState(0);
  const [detectionLevel, setDetectionLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [levelUpResult, setLevelUpResult] = useState(null);
  const startTime = useRef(null);

  const [startSession] = useMutation(START_SESSION);
  const [updateSession] = useMutation(UPDATE_SESSION);
  const [completeSession] = useMutation(COMPLETE_SESSION);

  const startGame = useCallback(async (missionId, missionName) => {
    const { data } = await startSession({ variables: { missionId, missionName } });
    setSessionId(data.startGameSession.id);
    setScore(0);
    setDetectionLevel(0);
    setGameOver(false);
    setLevelUpResult(null);
    startTime.current = Date.now();
    return data.startGameSession.id;
  }, [startSession]);

  const addScore = useCallback(async (points) => {
    if (!sessionId) return;
    const newScore = score + points;
    setScore(newScore);
    await updateSession({ variables: { sessionId, score: newScore } });
  }, [sessionId, score, updateSession]);

  const raisedDetection = useCallback(async (amount) => {
    if (!sessionId) return;
    const newLevel = Math.min(100, detectionLevel + amount);
    setDetectionLevel(newLevel);
    await updateSession({ variables: { sessionId, detectionLevel: newLevel } });
    if (newLevel >= 100) {
      await endGame(false);
    }
  }, [sessionId, detectionLevel, updateSession]);

  const solvePuzzle = useCallback(async (puzzleId) => {
    if (!sessionId) return;
    await updateSession({ variables: { sessionId, puzzleSolved: puzzleId } });
  }, [sessionId, updateSession]);

  const stealItem = useCallback(async (itemId, bonusScore = 50) => {
    if (!sessionId) return;
    const newScore = score + bonusScore;
    setScore(newScore);
    await updateSession({ variables: { sessionId, score: newScore, itemStolen: itemId } });
  }, [sessionId, score, updateSession]);

  const endGame = useCallback(async (success = true) => {
    if (!sessionId || gameOver) return;
    setGameOver(true);
    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
    const finalScore = success ? score : Math.floor(score * 0.5);
    const { data } = await completeSession({ variables: { sessionId, finalScore, timeSpent } });
    setLevelUpResult(data.completeGameSession);
    return data.completeGameSession;
  }, [sessionId, gameOver, score, completeSession]);

  return {
    sessionId, score, detectionLevel, gameOver, levelUpResult,
    startGame, addScore, raisedDetection, solvePuzzle, stealItem, endGame
  };
}
