import React, { useEffect, useRef, useCallback } from 'react';

/**
 * CyberDefenseGame — a simple tower defense game rendered on a canvas.
 *
 * Enemies follow a fixed path from left to right.
 * Player clicks on grid cells to place towers (costs 50 credits).
 * Towers auto-shoot at enemies in range.
 * If 10 enemies reach the end, game over.
 *
 * onScore(pts)  — called when an enemy is killed
 * onLivesChange(n) — called when lives decrease
 * onGameOver() — called when lives hit 0
 */

const CELL = 48;         // px per grid cell
const COLS = 18;
const ROWS = 10;
const W = COLS * CELL;   // 864
const H = ROWS * CELL;   // 480

const TOWER_COST = 50;
const TOWER_RANGE = CELL * 2.5;
const TOWER_DAMAGE = 20;
const TOWER_FIRE_RATE = 60; // frames between shots

// Fixed path: array of [col, row] grid waypoints
const PATH_WAYPOINTS = [
  [0,4],[2,4],[2,1],[5,1],[5,7],[9,7],[9,3],[13,3],[13,8],[17,8],[17,4]
];

// Expand waypoints into pixel coords
function buildPath() {
  const pts = [];
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [c0, r0] = PATH_WAYPOINTS[i];
    const [c1, r1] = PATH_WAYPOINTS[i + 1];
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
    for (let s = 0; s <= steps; s++) {
      pts.push([
        (c0 + (c1 - c0) * s / steps) * CELL + CELL / 2,
        (r0 + (r1 - r0) * s / steps) * CELL + CELL / 2
      ]);
    }
  }
  return pts;
}

// Set of path cells (blocked for tower placement)
function buildPathCells() {
  const set = new Set();
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [c0, r0] = PATH_WAYPOINTS[i];
    const [c1, r1] = PATH_WAYPOINTS[i + 1];
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
    for (let s = 0; s <= steps; s++) {
      const c = Math.round(c0 + (c1 - c0) * s / steps);
      const r = Math.round(r0 + (r1 - r0) * s / steps);
      set.add(`${c},${r}`);
    }
  }
  return set;
}

const PATH_PTS = buildPath();
const PATH_CELLS = buildPathCells();

const WAVE_SIZES = [5, 8, 12, 16, 20, 25, 30];

export default function CyberDefenseGame({ onScore, onLivesChange, onGameOver, credits, onSpend }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    towers: [],          // { col, row, hp, fireTimer, kills }
    enemies: [],         // { pathIdx, x, y, hp, maxHp, speed, reward }
    bullets: [],         // { x, y, tx, ty, speed }
    wave: 0,
    spawnTimer: 0,
    spawnQueue: 0,
    lives: 10,
    score: 0,
    running: true,
    hoveredCell: null,
    frame: 0,
    credits: credits || 200,
  });
  const creditsRef = useRef(credits || 200);
  const animRef = useRef(null);

  // Keep credits in sync from parent
  useEffect(() => {
    creditsRef.current = credits;
    stateRef.current.credits = credits;
  }, [credits]);

  const startWave = useCallback(() => {
    const s = stateRef.current;
    if (s.spawnQueue > 0) return;
    const waveIdx = Math.min(s.wave, WAVE_SIZES.length - 1);
    s.spawnQueue = WAVE_SIZES[waveIdx];
    s.wave += 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    const spawnEnemy = () => {
      const waveScale = 1 + s.wave * 0.3;
      s.enemies.push({
        pathIdx: 0,
        x: PATH_PTS[0][0],
        y: PATH_PTS[0][1],
        hp: Math.floor(60 * waveScale),
        maxHp: Math.floor(60 * waveScale),
        speed: 1 + s.wave * 0.08,
        reward: 25 + s.wave * 5,
      });
    };

    const handleClick = (e) => {
      if (!s.running) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const col = Math.floor(mx / CELL);
      const row = Math.floor(my / CELL);
      const key = `${col},${row}`;

      if (PATH_CELLS.has(key)) return;
      if (s.towers.some(t => t.col === col && t.row === row)) return;
      if (s.credits < TOWER_COST) return;

      s.credits -= TOWER_COST;
      onSpend && onSpend(TOWER_COST);
      s.towers.push({ col, row, fireTimer: 0 });
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      s.hoveredCell = { col: Math.floor(mx / CELL), row: Math.floor(my / CELL) };
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.fillStyle = '#080818';
      ctx.fillRect(0, 0, W, H);
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const key = `${c},${r}`;
          if (PATH_CELLS.has(key)) {
            ctx.fillStyle = '#12122a';
          } else {
            ctx.fillStyle = '#0a0a1e';
          }
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }

      // Hover highlight
      if (s.hoveredCell) {
        const { col, row } = s.hoveredCell;
        const key = `${col},${row}`;
        const blocked = PATH_CELLS.has(key) || s.towers.some(t => t.col === col && t.row === row);
        ctx.fillStyle = blocked ? 'rgba(255,51,85,0.2)' : (s.credits >= TOWER_COST ? 'rgba(0,255,153,0.15)' : 'rgba(255,170,0,0.15)');
        ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
      }

      // Path line
      ctx.strokeStyle = '#1a1a3a';
      ctx.lineWidth = CELL - 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH_PTS[0][0], PATH_PTS[0][1]);
      for (let i = 1; i < PATH_PTS.length; i++) {
        ctx.lineTo(PATH_PTS[i][0], PATH_PTS[i][1]);
      }
      ctx.stroke();

      // Path border glow
      ctx.strokeStyle = '#00ff9915';
      ctx.lineWidth = CELL - 2;
      ctx.beginPath();
      ctx.moveTo(PATH_PTS[0][0], PATH_PTS[0][1]);
      for (let i = 1; i < PATH_PTS.length; i++) {
        ctx.lineTo(PATH_PTS[i][0], PATH_PTS[i][1]);
      }
      ctx.stroke();

      // START / END markers
      ctx.fillStyle = '#00ff99';
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('START', PATH_PTS[0][0], PATH_PTS[0][1] + 4);
      ctx.fillStyle = '#ff3355';
      ctx.fillText('END', PATH_PTS[PATH_PTS.length-1][0], PATH_PTS[PATH_PTS.length-1][1] + 4);

      // Towers
      for (const t of s.towers) {
        const tx = t.col * CELL + CELL / 2;
        const ty = t.row * CELL + CELL / 2;
        // Base
        ctx.fillStyle = '#1a2a1a';
        ctx.strokeStyle = '#00ff9966';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(t.col * CELL + 4, t.row * CELL + 4, CELL - 8, CELL - 8, 6);
        ctx.fill();
        ctx.stroke();
        // Tower icon — triangle cannon
        ctx.fillStyle = '#00ff99';
        ctx.beginPath();
        ctx.moveTo(tx, ty - 12);
        ctx.lineTo(tx + 10, ty + 8);
        ctx.lineTo(tx - 10, ty + 8);
        ctx.closePath();
        ctx.fill();
        // Range ring on hover
        if (s.hoveredCell && s.hoveredCell.col === t.col && s.hoveredCell.row === t.row) {
          ctx.strokeStyle = 'rgba(0,255,153,0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(tx, ty, TOWER_RANGE, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Enemies
      for (const e of s.enemies) {
        // Body
        ctx.fillStyle = '#ff3355';
        ctx.strokeStyle = '#ff335588';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x + 3, e.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(e.x + 4, e.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // HP bar
        const bw = 24;
        const bh = 4;
        const bx = e.x - bw / 2;
        const by = e.y - 18;
        ctx.fillStyle = '#330011';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = e.hp > e.maxHp * 0.5 ? '#00ff99' : '#ff3355';
        ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
      }

      // Bullets
      for (const b of s.bullets) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wave start button (when no enemies / queue)
      if (s.spawnQueue === 0 && s.enemies.length === 0 && s.running) {
        const bx = W / 2 - 80;
        const by = H - 44;
        ctx.fillStyle = 'rgba(0,255,153,0.15)';
        ctx.strokeStyle = '#00ff9966';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, 160, 32, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00ff99';
        ctx.font = 'bold 13px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`SEND WAVE ${s.wave + 1}`, W / 2, by + 21);
      }

      // Credits display
      ctx.fillStyle = '#00ff9999';
      ctx.font = '12px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(`⬡ ${s.credits} credits`, 8, 18);
      ctx.fillStyle = '#ff335599';
      ctx.fillText(`♥ ${s.lives} lives`, 8, 34);

      // Wave label
      ctx.fillStyle = '#a0a0c0';
      ctx.textAlign = 'right';
      ctx.fillText(`Wave ${s.wave}`, W - 8, 18);
    };

    const update = () => {
      if (!s.running) return;
      s.frame++;

      // Spawn enemies
      if (s.spawnQueue > 0) {
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          spawnEnemy();
          s.spawnQueue--;
          s.spawnTimer = 40;
        }
      }

      // Move enemies
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        if (e.pathIdx >= PATH_PTS.length - 1) {
          // Reached end
          s.enemies.splice(i, 1);
          s.lives = Math.max(0, s.lives - 1);
          onLivesChange && onLivesChange(s.lives);
          if (s.lives <= 0) {
            s.running = false;
            onGameOver && onGameOver(s.score);
          }
          continue;
        }
        const target = PATH_PTS[e.pathIdx + 1];
        const dx = target[0] - e.x;
        const dy = target[1] - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < e.speed) {
          e.x = target[0];
          e.y = target[1];
          e.pathIdx++;
        } else {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      }

      // Tower shooting
      for (const t of s.towers) {
        t.fireTimer = Math.max(0, (t.fireTimer || 0) - 1);
        if (t.fireTimer > 0) continue;
        const tx = t.col * CELL + CELL / 2;
        const ty = t.row * CELL + CELL / 2;
        // Find nearest enemy in range
        let best = null, bestDist = Infinity;
        for (const e of s.enemies) {
          const dx = e.x - tx, dy = e.y - ty;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= TOWER_RANGE && d < bestDist) {
            best = e;
            bestDist = d;
          }
        }
        if (best) {
          s.bullets.push({ x: tx, y: ty, tx: best.x, ty: best.y, target: best, speed: 6 });
          t.fireTimer = TOWER_FIRE_RATE;
        }
      }

      // Move bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        // Track target
        if (b.target && s.enemies.includes(b.target)) {
          b.tx = b.target.x;
          b.ty = b.target.y;
        }
        const dx = b.tx - b.x, dy = b.ty - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < b.speed) {
          // Hit
          if (b.target && s.enemies.includes(b.target)) {
            b.target.hp -= TOWER_DAMAGE;
            if (b.target.hp <= 0) {
              const reward = b.target.reward;
              s.score += reward;
              s.credits += reward;
              onScore && onScore(s.score);
              onSpend && onSpend(-reward); // add credits back via negative spend
              s.enemies.splice(s.enemies.indexOf(b.target), 1);
            }
          }
          s.bullets.splice(i, 1);
        } else {
          b.x += (dx / dist) * b.speed;
          b.y += (dy / dist) * b.speed;
        }
      }
    };

    const loop = () => {
      update();
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    // Wave start button click
    const handleWaveClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const bx = W / 2 - 80, by = H - 44;
      const s = stateRef.current;
      if (mx >= bx && mx <= bx + 160 && my >= by && my <= by + 32) {
        if (s.spawnQueue === 0 && s.enemies.length === 0 && s.running) {
          startWave();
        }
      }
    };
    canvas.addEventListener('click', handleWaveClick);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('click', handleWaveClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
    />
  );
}
