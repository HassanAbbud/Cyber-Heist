import React, { useState, useEffect } from 'react';

// A simple logic/cipher puzzle presented as a terminal interface.
// The player must enter the correct code to unlock access.
const PUZZLES = {
  server_0: {
    title: 'FIREWALL BYPASS',
    prompt: 'Decrypt the sequence: 3-1-4-1-5 → subtract each digit by 1 →',
    answer: '20304',
    hint: 'Each digit minus 1, concatenated'
  },
  server_1: {
    title: 'ENCRYPTION KEY',
    prompt: 'Binary to decimal: 1010 =',
    answer: '10',
    hint: '8+2=10'
  },
  server_2: {
    title: 'ACCESS CODE',
    prompt: 'ROT13 decode: UNPXRE →',
    answer: 'HACKER',
    hint: 'Each letter shifted 13 positions'
  },
  server_3: {
    title: 'HASH COLLISION',
    prompt: 'What is 0xFF in decimal?',
    answer: '255',
    hint: '15*16 + 15'
  }
};

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
  },
  terminal: {
    background: '#050510', border: '1px solid #00ff9966',
    borderRadius: '10px', padding: '32px', width: '440px',
    fontFamily: 'Courier New, monospace'
  },
  topBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  title: { color: '#00ff99', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' },
  close: { color: '#ff3355', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  prompt: { color: '#c0c0e0', fontSize: '13px', lineHeight: '1.7', marginBottom: '20px', minHeight: '60px' },
  inputRow: { display: 'flex', gap: '10px' },
  input: {
    flex: 1, background: '#0a0a18', border: '1px solid #00ff9944',
    borderRadius: '6px', color: '#00ff99', padding: '10px 14px',
    fontSize: '14px', outline: 'none', fontFamily: 'Courier New, monospace'
  },
  submitBtn: {
    background: '#00ff9922', border: '1px solid #00ff9966',
    color: '#00ff99', padding: '10px 18px', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
  },
  feedback: (ok) => ({
    marginTop: '14px', fontSize: '13px', textAlign: 'center',
    color: ok ? '#00ff99' : '#ff3355', fontWeight: 'bold', letterSpacing: '1px'
  }),
  hint: { marginTop: '10px', color: '#606080', fontSize: '12px', textAlign: 'center' }
};

export default function PuzzleModal({ puzzleId, onSolve, onClose }) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const puzzle = PUZZLES[puzzleId] || PUZZLES['server_0'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const correct = input.trim().toUpperCase() === puzzle.answer.toUpperCase();
    if (correct) {
      setFeedback('ACCESS GRANTED ✓');
      setSolved(true);
      setTimeout(() => onSolve(puzzleId), 1000);
    } else {
      setFeedback('INCORRECT — try again');
      setInput('');
    }
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.terminal}>
        <div style={s.topBar}>
          <span style={s.title}>{puzzle.title}</span>
          <button style={s.close} onClick={onClose}>✕ ABORT</button>
        </div>
        <div style={s.prompt}>
          <span style={{ color: '#00ff9966' }}>{'> '}</span>
          {puzzle.prompt}
        </div>
        {!solved && (
          <form onSubmit={handleSubmit} style={s.inputRow}>
            <input
              style={s.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter code..."
              autoFocus
            />
            <button style={s.submitBtn} type="submit">EXEC</button>
          </form>
        )}
        {feedback && <div style={s.feedback(solved)}>{feedback}</div>}
        {!solved && (
          <div style={s.hint}>
            {showHint
              ? <span style={{ color: '#ffaa0088' }}>Hint: {puzzle.hint}</span>
              : <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowHint(true)}>Need a hint?</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}
