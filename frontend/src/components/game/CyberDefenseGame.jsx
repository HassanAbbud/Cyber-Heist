import React, { useEffect, useRef, useState, useCallback } from 'react';

const CELL = 48;
const COLS = 17;
const ROWS = 10;
const W = COLS * CELL;
const H = ROWS * CELL;

// ── Tower types ────────────────────────────────────────────────────────────
const TTYPES = {
  LASER: { name:'LASER', color:'#ff6644', bg:'#2a1008', element:'fire',
           dmg:30, range:2.4, rate:65, hits:1, desc:'High single-target damage' },
  CRYO:  { name:'CRYO',  color:'#66ccff', bg:'#08182a', element:'ice',
           dmg:12, range:2.2, rate:35, hits:1, slow:90, desc:'Slows enemies on hit' },
  PULSE: { name:'PULSE', color:'#ffee44', bg:'#2a2600', element:'electric',
           dmg:14, range:1.8, rate:80, hits:99, desc:'Hits ALL enemies in range' },
  VIRUS: { name:'VIRUS', color:'#55ee88', bg:'#082a14', element:'poison',
           dmg:6, range:3.0, rate:48, hits:1, dot:5, dotDur:200, desc:'Applies poison DoT' },
};
const TYPE_KEYS = Object.keys(TTYPES);
const T_DMG   = [0,1,1.7,2.8,4.5,7.5];
const T_RANGE = [0,1,1.2,1.4,1.65,2.0];
const T_RATE  = [0,1,0.88,0.76,0.65,0.55];
const MAX_TIER = 5;
const BUY_COST = 50;

// ── Wave modifiers ─────────────────────────────────────────────────────────
const MOD_POOL = [
  { id:'coins',       name:'CRYPTO BONUS',    icon:'₿', color:'#ffaa00',
    bad:'No drawbacks', good:'+150 credits', apply:s=>{s.credits+=150;} },
  { id:'immune_fire', name:'FIREWALL',         icon:'🔥',color:'#ff6644',
    bad:'Enemies immune to LASER', good:'+80 credits', apply:s=>{s.credits+=80;s.waveImmune='LASER';} },
  { id:'immune_cryo', name:'ANTIFREEZE',       icon:'❄', color:'#66ccff',
    bad:'Enemies cannot be slowed', good:'+80 credits', apply:s=>{s.credits+=80;s.waveImmune='CRYO';} },
  { id:'fast',        name:'OVERCLOCK',        icon:'⚡',color:'#ffffff',
    bad:'Enemies 50% faster', good:'+150 credits', apply:s=>{s.credits+=150;s.waveSpeedMult=1.5;} },
  { id:'tough',       name:'ARMORED PAYLOAD',  icon:'🛡', color:'#aaaaaa',
    bad:'Enemies 70% more HP', good:'+100 credits', apply:s=>{s.credits+=100;s.waveHpMult=1.7;} },
  { id:'force_laser', name:'LASER CACHE',      icon:'🔴',color:'#ff6644',
    bad:'', good:'Next 4 summons are LASER', apply:s=>{s.forceType='LASER';s.forceCount=4;} },
  { id:'force_cryo',  name:'CRYO CACHE',       icon:'🔵',color:'#66ccff',
    bad:'', good:'Next 4 summons are CRYO',  apply:s=>{s.forceType='CRYO';s.forceCount=4;} },
  { id:'force_pulse', name:'PULSE CACHE',      icon:'🟡',color:'#ffee44',
    bad:'', good:'Next 4 summons are PULSE', apply:s=>{s.forceType='PULSE';s.forceCount=4;} },
  { id:'force_virus', name:'VIRUS CACHE',      icon:'🟢',color:'#55ee88',
    bad:'', good:'Next 4 summons are VIRUS', apply:s=>{s.forceType='VIRUS';s.forceCount=4;} },
  { id:'extra_life',  name:'BACKUP SERVER',    icon:'💎',color:'#aa66ff',
    bad:'Enemies 50% more HP', good:'+3 lives', apply:s=>{s.lives=Math.min(s.lives+3,20);s.waveHpMult=1.5;} },
  { id:'double_coins',name:'CRYPTO PUMP',      icon:'💰',color:'#ffdd00',
    bad:'Enemies 30% faster', good:'Kill rewards ×2', apply:s=>{s.waveSpeedMult=1.3;s.waveCoinMult=2;} },
  { id:'pulse_power', name:'SURGE PROTOCOL',   icon:'⚡',color:'#ffff00',
    bad:'', good:'PULSE deals 3× damage this wave', apply:s=>{s.waveTypePower={PULSE:3};} },
  { id:'virus_power', name:'ZERO DAY EXPLOIT', icon:'☣', color:'#55ee88',
    bad:'', good:'VIRUS DoT 5× stronger this wave', apply:s=>{s.waveTypePower={VIRUS:5};} },
];

const WAVE_SIZES = [5,8,12,16,20,25,30,35,40,50,55,60,65,70,75,80,85,90,95,100];

// ── Maps: different path per mission ──────────────────────────────────────
const MAPS = {
  corp_breach: {
    name: 'Corporate Breach',
    maxWaves: 10,
    waypoints: [[0,2],[3,2],[3,0],[6,0],[6,5],[10,5],[10,1],[14,1],[14,8],[16,8]],
  },
  bank_heist: {
    name: 'Digital Bank Heist',
    maxWaves: 15,
    waypoints: [[0,0],[4,0],[4,4],[1,4],[1,8],[6,8],[6,3],[11,3],[11,8],[16,8]],
  },
  gov_blackout: {
    name: 'Government Blackout',
    maxWaves: 20,
    waypoints: [[0,5],[2,5],[2,1],[8,1],[8,8],[5,8],[5,4],[12,4],[12,7],[16,7]],
  },
  default: {
    name: 'Defense Grid',
    maxWaves: 10,
    waypoints: [[0,4],[3,4],[3,1],[7,1],[7,7],[11,7],[11,2],[14,2],[14,8],[16,8]],
  },
};

function buildPath(waypoints) {
  const pts = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c0,r0] = waypoints[i], [c1,r1] = waypoints[i+1];
    const steps = Math.max(Math.abs(c1-c0), Math.abs(r1-r0));
    for (let s = 0; s <= steps; s++)
      pts.push([(c0+(c1-c0)*s/steps)*CELL+CELL/2, (r0+(r1-r0)*s/steps)*CELL+CELL/2]);
  }
  return pts;
}
function buildPathCells(waypoints) {
  const set = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c0,r0] = waypoints[i], [c1,r1] = waypoints[i+1];
    const steps = Math.max(Math.abs(c1-c0), Math.abs(r1-r0));
    for (let s = 0; s <= steps; s++)
      set.add(`${Math.round(c0+(c1-c0)*s/steps)},${Math.round(r0+(r1-r0)*s/steps)}`);
  }
  return set;
}

// ── Tower draw ─────────────────────────────────────────────────────────────
function drawTower(ctx, cx, cy, type, tier, selected) {
  const t = TTYPES[type];
  const r = 17 + tier * 1.5;
  ctx.save();
  if (selected) { ctx.shadowColor='#ffffff'; ctx.shadowBlur=16; }
  else if (tier >= 3) { ctx.shadowColor=t.color; ctx.shadowBlur=8+tier*2; }
  ctx.fillStyle = t.color;
  ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = selected ? 2 : 1;
  ctx.beginPath();
  if (type==='LASER') {
    ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r*0.9,cy+r*0.75); ctx.lineTo(cx-r*0.9,cy+r*0.75); ctx.closePath();
  } else if (type==='CRYO') {
    for (let i=0;i<6;i++) { const a=i*Math.PI/3-Math.PI/6; (i?ctx.lineTo:ctx.moveTo).call(ctx,cx+r*Math.cos(a),cy+r*Math.sin(a)); } ctx.closePath();
  } else if (type==='PULSE') {
    ctx.arc(cx,cy,r*0.62,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle='transparent'; ctx.strokeStyle=t.color; ctx.lineWidth=2.5;
  } else if (type==='VIRUS') {
    ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r*0.82,cy); ctx.lineTo(cx,cy+r); ctx.lineTo(cx-r*0.82,cy); ctx.closePath();
  }
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  if (tier > 1) {
    ctx.fillStyle='#ffffff'; ctx.font=`bold ${Math.round(r*0.55)}px Courier New`;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(tier,cx,cy+1);
  }
  ctx.restore();
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CyberDefenseGame({ onScore, onLivesChange, onGameOver, missionId }) {
  const mapDef = MAPS[missionId] || MAPS.default;
  const MAX_WAVES = mapDef.maxWaves;
  const PATH_PTS   = buildPath(mapDef.waypoints);
  const PATH_CELLS = buildPathCells(mapDef.waypoints);

  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const pathRef   = useRef({ PATH_PTS, PATH_CELLS });

  const [modal, setModal]     = useState(null);
  const [prepPhase, setPrepPhase] = useState(false); // true = modifier chosen, waiting for player to start wave
  const [pendingWave, setPendingWave] = useState(null); // wave number queued during prep
  const [uiState, setUiState] = useState({
    credits:200, lives:10, wave:0, score:0,
    pending:null, selected:null, forceType:null, forceCount:0,
  });

  const G = useRef({
    towers:[], enemies:[], bullets:[], floaters:[],
    credits:200, lives:10, wave:0, score:0,
    running:true, frame:0,
    spawnQueue:0, spawnTimer:0, waveActive:false,
    pending:null, selected:null, hoveredCell:null,
    forceType:null, forceCount:0,
    waveImmune:null, waveSpeedMult:1, waveHpMult:1, waveCoinMult:1, waveTypePower:{},
  }).current;

  const syncUi = useCallback(() => {
    setUiState({
      credits:G.credits, lives:G.lives, wave:G.wave, score:G.score,
      pending:G.pending, selected:G.selected?{type:G.selected.type,tier:G.selected.tier}:null,
      forceType:G.forceType, forceCount:G.forceCount,
    });
  }, []);

  const rollPending = useCallback(() => {
    const type = G.forceCount > 0 ? G.forceType : TYPE_KEYS[Math.floor(Math.random()*TYPE_KEYS.length)];
    if (G.forceCount > 0) G.forceCount--;
    G.pending = { type, tier:1 };
    syncUi();
  }, [syncUi]);

  const buyTower = useCallback(() => {
    if (G.credits < BUY_COST || G.pending) return;
    G.credits -= BUY_COST; rollPending(); syncUi();
  }, [rollPending, syncUi]);

  const rerollPending = useCallback(() => {
    if (G.credits < 25 || !G.pending) return;
    G.credits -= 25; rollPending();
  }, [rollPending]);

  const sellTower = useCallback(() => {
    if (!G.selected) return;
    G.credits += Math.floor(BUY_COST * (G.selected.tier * 0.5));
    G.towers = G.towers.filter(t => t !== G.selected);
    G.selected = null; syncUi();
  }, [syncUi]);

  const showWaveModal = useCallback(() => {
    const shuffled = [...MOD_POOL].sort(() => Math.random()-0.5);
    setModal({ choices: shuffled.slice(0,3) });
  }, []);

  const pickModifier = useCallback((mod) => {
    G.waveImmune=null; G.waveSpeedMult=1; G.waveHpMult=1; G.waveCoinMult=1; G.waveTypePower={};
    mod.apply(G);
    setModal(null);
    setPendingWave(G.wave + 1);
    setPrepPhase(true);
    syncUi();
  }, [syncUi]);

  const startWave = useCallback((waveNum) => {
    G.wave = waveNum;
    G.spawnQueue = WAVE_SIZES[Math.min(G.wave-1, WAVE_SIZES.length-1)];
    G.spawnTimer = 40;
    G.waveActive = true;
    setPrepPhase(false);
    setPendingWave(null);
    syncUi();
  }, [syncUi]);

  // Show the first wave modal immediately on mount
  useEffect(() => {
    showWaveModal();
  }, []);

  // ── Canvas game loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const { PATH_PTS, PATH_CELLS } = pathRef.current;

    const towerAt = (col,row) => G.towers.find(t => t.col===col && t.row===row);

    const spawnEnemy = () => {
      const wScale = 1 + G.wave * 0.25;
      const hp = Math.floor(70 * wScale * (G.waveHpMult||1));
      G.enemies.push({
        pathIdx:0, x:PATH_PTS[0][0], y:PATH_PTS[0][1],
        hp, maxHp:hp, speed:(1+G.wave*0.07)*(G.waveSpeedMult||1),
        reward:Math.floor((25+G.wave*5)*(G.waveCoinMult||1)),
        slowTimer:0, poison:0, poisonTimer:0,
      });
    };

    const handleClick = e => {
      if (!G.running) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX-rect.left)*(canvas.width/rect.width);
      const my = (e.clientY-rect.top)*(canvas.height/rect.height);
      const col = Math.floor(mx/CELL), row = Math.floor(my/CELL);
      if (col<0||col>=COLS||row<0||row>=ROWS) return;
      const clicked = towerAt(col,row);

      if (clicked) {
        if (G.selected && G.selected!==clicked &&
            G.selected.type===clicked.type && G.selected.tier===clicked.tier &&
            G.selected.tier < MAX_TIER) {
          const newTier = G.selected.tier + 1;
          G.towers = G.towers.filter(t=>t!==G.selected&&t!==clicked);
          G.towers.push({ col, row, type:clicked.type, tier:newTier, fireTimer:0 });
          G.floaters.push({ x:col*CELL+CELL/2, y:row*CELL, text:'MERGED!', color:'#ffee44', life:60 });
          G.selected = null;
        } else {
          G.selected = (G.selected===clicked) ? null : clicked;
        }
      } else {
        if (G.selected) { G.selected=null; syncUi(); return; }
        if (!G.pending) return;
        if (PATH_CELLS.has(`${col},${row}`)) return;
        G.towers.push({ col, row, type:G.pending.type, tier:G.pending.tier, fireTimer:0 });
        G.pending = null;
      }
      syncUi();
    };

    const handleMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      G.hoveredCell = {
        col: Math.floor((e.clientX-rect.left)*(canvas.width/rect.width)/CELL),
        row: Math.floor((e.clientY-rect.top)*(canvas.height/rect.height)/CELL),
      };
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);

    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      if (!G.running) return;
      G.frame++;

      if (G.spawnQueue > 0) {
        if (--G.spawnTimer <= 0) { spawnEnemy(); G.spawnQueue--; G.spawnTimer=38; }
      }

      if (G.waveActive && G.spawnQueue===0 && G.enemies.length===0) {
        G.waveActive = false;
        if (G.wave >= MAX_WAVES) {
          // All waves cleared — victory!
          setTimeout(() => { G.running=false; onGameOver && onGameOver(G.score, true); }, 600);
        } else {
          setTimeout(() => showWaveModal(), 400);
        }
      }

      // Move enemies
      for (let i=G.enemies.length-1; i>=0; i--) {
        const e = G.enemies[i];
        if (e.slowTimer>0) e.slowTimer--;
        if (e.poison>0) {
          if (--e.poisonTimer <= 0) {
            e.hp -= e.poison; e.poisonTimer=20;
            if (--e.poisonDur <= 0) e.poison=0;
          }
        }
        if (e.hp <= 0) {
          G.score += e.reward; G.credits += e.reward;
          G.floaters.push({ x:e.x, y:e.y-10, text:`+${e.reward}`, color:'#ffaa00', life:50 });
          onScore && onScore(G.score);
          G.enemies.splice(i,1); syncUi(); continue;
        }
        if (e.pathIdx >= PATH_PTS.length-1) {
          G.enemies.splice(i,1);
          G.lives = Math.max(0, G.lives-1);
          onLivesChange && onLivesChange(G.lives);
          if (G.lives<=0) { G.running=false; onGameOver && onGameOver(G.score); }
          syncUi(); continue;
        }
        const spd = e.slowTimer>0 ? e.speed*0.4 : e.speed;
        const [tx,ty] = PATH_PTS[e.pathIdx+1];
        const dx=tx-e.x, dy=ty-e.y, dist=Math.hypot(dx,dy);
        if (dist < spd) { e.x=tx; e.y=ty; e.pathIdx++; }
        else { e.x+=dx/dist*spd; e.y+=dy/dist*spd; }
      }

      // Towers shoot
      for (const t of G.towers) {
        t.fireTimer = Math.max(0,(t.fireTimer||0)-1);
        if (t.fireTimer>0) continue;
        const tt = TTYPES[t.type];
        const range = tt.range * CELL * T_RANGE[t.tier];
        const tx = t.col*CELL+CELL/2, ty = t.row*CELL+CELL/2;
        let targets = G.enemies
          .filter(e => Math.hypot(e.x-tx,e.y-ty)<=range && G.waveImmune!==t.type)
          .sort((a,b) => b.pathIdx-a.pathIdx);
        if (tt.hits < 99) targets = targets.slice(0, tt.hits);
        if (!targets.length) continue;
        for (const te of targets)
          G.bullets.push({ x:tx, y:ty, target:te, type:t.type, tier:t.tier, speed:7 });
        t.fireTimer = Math.round(tt.rate * T_RATE[t.tier]);
      }

      // Bullets
      for (let i=G.bullets.length-1; i>=0; i--) {
        const b = G.bullets[i];
        if (!G.enemies.includes(b.target)) { G.bullets.splice(i,1); continue; }
        const dx=b.target.x-b.x, dy=b.target.y-b.y, dist=Math.hypot(dx,dy);
        if (dist < b.speed) {
          const tt = TTYPES[b.type];
          let dmg = tt.dmg * T_DMG[b.tier];
          if (G.waveTypePower && G.waveTypePower[b.type]) dmg *= G.waveTypePower[b.type];
          b.target.hp -= Math.round(dmg);
          if (tt.slow && G.waveImmune!=='CRYO') b.target.slowTimer = tt.slow;
          if (tt.dot) {
            const d = tt.dot*(G.waveTypePower?.[b.type]||1);
            b.target.poison=d; b.target.poisonTimer=20; b.target.poisonDur=tt.dotDur/20;
          }
          G.bullets.splice(i,1);
        } else { b.x+=dx/dist*b.speed; b.y+=dy/dist*b.speed; }
      }

      // Floaters
      for (let i=G.floaters.length-1; i>=0; i--) {
        G.floaters[i].y -= 0.7; G.floaters[i].life--;
        if (G.floaters[i].life<=0) G.floaters.splice(i,1);
      }

      // ── Draw ──────────────────────────────────────────────────────────
      const c = ctx;
      c.clearRect(0,0,W,H);
      c.fillStyle='#080818'; c.fillRect(0,0,W,H);

      for (let col=0; col<COLS; col++)
        for (let row=0; row<ROWS; row++) {
          c.fillStyle = PATH_CELLS.has(`${col},${row}`) ? '#10102a' : '#0a0a1e';
          c.fillRect(col*CELL+1, row*CELL+1, CELL-2, CELL-2);
        }

      // Hover highlight
      const hc = G.hoveredCell;
      if (hc && hc.col>=0 && hc.col<COLS && hc.row>=0 && hc.row<ROWS) {
        const blocked = PATH_CELLS.has(`${hc.col},${hc.row}`) || !!towerAt(hc.col,hc.row);
        const hovT = towerAt(hc.col, hc.row);
        if (G.pending && !G.selected) {
          c.fillStyle = blocked ? 'rgba(255,51,85,0.25)' : 'rgba(0,255,153,0.18)';
          c.fillRect(hc.col*CELL, hc.row*CELL, CELL, CELL);
        } else if (G.selected && hovT && hovT!==G.selected &&
                   hovT.type===G.selected.type && hovT.tier===G.selected.tier) {
          c.fillStyle='rgba(255,238,68,0.3)';
          c.fillRect(hc.col*CELL, hc.row*CELL, CELL, CELL);
        }
        // Range preview on hover (non-selected tower)
        if (hovT && hovT!==G.selected) {
          const tt = TTYPES[hovT.type];
          c.strokeStyle=tt.color+'44'; c.lineWidth=1.5;
          c.beginPath(); c.arc(hovT.col*CELL+CELL/2, hovT.row*CELL+CELL/2, tt.range*CELL*T_RANGE[hovT.tier],0,Math.PI*2); c.stroke();
        }
      }

      // Path
      c.save();
      c.strokeStyle='#14143a'; c.lineWidth=CELL-4; c.lineCap='round'; c.lineJoin='round';
      c.beginPath(); c.moveTo(PATH_PTS[0][0],PATH_PTS[0][1]);
      for (let i=1;i<PATH_PTS.length;i++) c.lineTo(PATH_PTS[i][0],PATH_PTS[i][1]);
      c.stroke();
      c.strokeStyle='#00ff9910'; c.lineWidth=CELL-6;
      c.beginPath(); c.moveTo(PATH_PTS[0][0],PATH_PTS[0][1]);
      for (let i=1;i<PATH_PTS.length;i++) c.lineTo(PATH_PTS[i][0],PATH_PTS[i][1]);
      c.stroke();
      c.restore();

      c.font='bold 10px Courier New'; c.textAlign='center'; c.textBaseline='middle';
      c.fillStyle='#00ff99'; c.fillText('IN',PATH_PTS[0][0],PATH_PTS[0][1]);
      c.fillStyle='#ff3355'; c.fillText('OUT',PATH_PTS[PATH_PTS.length-1][0],PATH_PTS[PATH_PTS.length-1][1]);

      // Selected tower range
      if (G.selected) {
        const tt = TTYPES[G.selected.type];
        c.strokeStyle=tt.color+'88'; c.lineWidth=2;
        c.beginPath(); c.arc(G.selected.col*CELL+CELL/2, G.selected.row*CELL+CELL/2, tt.range*CELL*T_RANGE[G.selected.tier],0,Math.PI*2); c.stroke();
      }

      // Towers
      for (const t of G.towers) {
        c.fillStyle=TTYPES[t.type].bg;
        c.beginPath(); c.roundRect(t.col*CELL+4,t.row*CELL+4,CELL-8,CELL-8,6); c.fill();
        drawTower(c, t.col*CELL+CELL/2, t.row*CELL+CELL/2, t.type, t.tier, t===G.selected);
      }

      // Bullets
      for (const b of G.bullets) {
        c.fillStyle=TTYPES[b.type].color;
        c.beginPath(); c.arc(b.x,b.y,3.5,0,Math.PI*2); c.fill();
      }

      // Enemies
      for (const e of G.enemies) {
        if (e.slowTimer>0) { c.strokeStyle='#66ccff44'; c.lineWidth=6; c.beginPath(); c.arc(e.x,e.y,13,0,Math.PI*2); c.stroke(); }
        if (e.poison>0)    { c.strokeStyle='#55ee8844'; c.lineWidth=5; c.beginPath(); c.arc(e.x,e.y,12,0,Math.PI*2); c.stroke(); }
        c.fillStyle = e.slowTimer>0 ? '#aa88cc' : '#ff3355';
        c.strokeStyle='#ff335566'; c.lineWidth=1;
        c.beginPath(); c.arc(e.x,e.y,10,0,Math.PI*2); c.fill(); c.stroke();
        c.fillStyle='#fff'; c.beginPath(); c.arc(e.x+3,e.y-2,3,0,Math.PI*2); c.fill();
        c.fillStyle='#000'; c.beginPath(); c.arc(e.x+4,e.y-2,1.5,0,Math.PI*2); c.fill();
        const bw=26, bx=e.x-bw/2, by=e.y-20;
        c.fillStyle='#330011'; c.fillRect(bx,by,bw,4);
        c.fillStyle=e.hp/e.maxHp>0.5?'#00ff99':'#ff3355';
        c.fillRect(bx,by,bw*(e.hp/e.maxHp),4);
      }

      // Floaters
      for (const f of G.floaters) {
        c.globalAlpha=f.life/50;
        c.fillStyle=f.color; c.font='bold 12px Courier New';
        c.textAlign='center'; c.textBaseline='middle';
        c.fillText(f.text,f.x,f.y);
        c.globalAlpha=1;
      }
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showWaveModal, syncUi]);

  // ── UI styles ─────────────────────────────────────────────────────────────
  const ss = {
    wrap:      { position:'relative', width:'100%', height:'100%', display:'flex', overflow:'hidden' },
    sidebar:   { width:'190px', flexShrink:0, background:'#0d0d1a', borderLeft:'1px solid #00ff9922',
                 padding:'12px', display:'flex', flexDirection:'column', gap:'10px',
                 fontFamily:'Courier New', overflowY:'auto' },
    sTitle:    { color:'#a0a0c0', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' },
    tCard: c => ({ background:TTYPES[c].bg, border:`1px solid ${TTYPES[c].color}44`, borderRadius:'8px', padding:'10px', textAlign:'center' }),
    tName: c => ({ color:TTYPES[c].color, fontWeight:'bold', fontSize:'14px' }),
    tDesc:     { color:'#808090', fontSize:'11px', marginTop:'3px' },
    btn: (disabled, color='#00ff99') => ({
      width:'100%', background:disabled?'#0a0a18':'rgba(0,255,153,0.1)',
      border:`1px solid ${disabled?'#333':color+'66'}`, color:disabled?'#404050':color,
      padding:'8px', borderRadius:'6px', cursor:disabled?'not-allowed':'pointer',
      fontSize:'12px', fontWeight:'bold', letterSpacing:'1px',
    }),
    modalOverlay: { position:'absolute', inset:0, background:'rgba(0,0,0,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
    modalBox:  { background:'#0d0d1a', border:'1px solid #00ff9944', borderRadius:'12px',
                 padding:'24px', width:'440px', fontFamily:'Courier New' },
    modalTitle:{ color:'#00ff99', fontSize:'16px', fontWeight:'bold', textAlign:'center',
                 letterSpacing:'2px', marginBottom:'20px' },
    choiceCard: c => ({ background:'#080818', border:`1px solid ${c}44`, borderRadius:'8px',
      padding:'14px 16px', cursor:'pointer', marginBottom:'10px', transition:'border-color 0.15s' }),
  };

  const { credits, lives, wave, score, pending, selected, forceType, forceCount } = uiState;

  return (
    <div style={ss.wrap}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:'6px' }}>
        <canvas ref={canvasRef} width={W} height={H}
          style={{ width:'100%', height:'100%', cursor:'crosshair', display:'block' }} />
      </div>

      <div style={ss.sidebar}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#00ff99', fontWeight:'bold', fontSize:'15px' }}>⬡ {credits}</span>
            <span style={{ color:lives<=3?'#ff3355':'#c0c0e0', fontSize:'14px' }}>♥ {lives}</span>
          </div>
          <div style={{ color:'#606080', fontSize:'12px', marginTop:'2px' }}>Wave {wave}/{MAX_WAVES} · {score.toLocaleString()} pts</div>
        </div>

        {/* Prep phase — big START WAVE button */}
        {prepPhase && (
          <>
            <div style={{ background:'#0a1a0a', border:'1px solid #00ff9933', borderRadius:'8px',
              padding:'10px', textAlign:'center' }}>
              <div style={{ color:'#00ff9988', fontSize:'11px', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' }}>
                Preparation Phase
              </div>
              <div style={{ color:'#606080', fontSize:'11px', marginBottom:'10px', lineHeight:1.5 }}>
                Place towers, then send wave {pendingWave}.
              </div>
              <button
                onClick={() => startWave(pendingWave)}
                style={{ width:'100%', background:'#00ff9933', border:'2px solid #00ff99',
                  color:'#00ff99', padding:'10px', borderRadius:'8px', cursor:'pointer',
                  fontSize:'14px', fontWeight:'bold', letterSpacing:'2px' }}>
                ▶ START WAVE {pendingWave}
              </button>
            </div>
            <hr style={{ border:'none', borderTop:'1px solid #ffffff11' }}/>
          </>
        )}

        <hr style={{ border:'none', borderTop:'1px solid #ffffff11' }}/>

        <div style={ss.sTitle}>Next Tower</div>
        {pending ? (
          <>
            <div style={ss.tCard(pending.type)}>
              <div style={ss.tName(pending.type)}>{pending.type}</div>
              <div style={ss.tDesc}>{TTYPES[pending.type].desc}</div>
              <div style={{ color:TTYPES[pending.type].color+'99', fontSize:'11px', marginTop:'4px' }}>
                Tier {pending.tier} · Click grid to place
              </div>
            </div>
            <button style={ss.btn(credits<25)} onClick={rerollPending}>REROLL (25 ⬡)</button>
          </>
        ) : (
          <button style={ss.btn(credits < BUY_COST)} onClick={buyTower}>
            BUY TOWER ({BUY_COST} ⬡)
          </button>
        )}

        {forceCount > 0 && (
          <div style={{ color:'#ffaa00', fontSize:'11px', textAlign:'center' }}>
            🔒 Forced: {forceType} ({forceCount} left)
          </div>
        )}

        <hr style={{ border:'none', borderTop:'1px solid #ffffff11' }}/>

        <div style={ss.sTitle}>Selected</div>
        {selected ? (
          <>
            <div style={ss.tCard(selected.type)}>
              <div style={ss.tName(selected.type)}>{selected.type} T{selected.tier}</div>
              {selected.tier < MAX_TIER
                ? <div style={{ color:'#ffee44', fontSize:'11px', marginTop:'3px' }}>Click matching T{selected.tier} to merge → T{selected.tier+1}</div>
                : <div style={{ color:'#ffaa00', fontSize:'11px', marginTop:'3px' }}>MAX TIER</div>}
            </div>
            <button style={ss.btn(false,'#ff3355')} onClick={sellTower}>
              SELL (+{Math.floor(BUY_COST*(selected.tier*0.5))} ⬡)
            </button>
          </>
        ) : (
          <div style={{ color:'#404060', fontSize:'11px', lineHeight:1.6 }}>
            Click a tower to select it.<br/>Select two matching towers to merge them.
          </div>
        )}

        <hr style={{ border:'none', borderTop:'1px solid #ffffff11' }}/>

        <div style={ss.sTitle}>Tower Types</div>
        {TYPE_KEYS.map(k => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
            <div style={{ width:10, height:10, background:TTYPES[k].color, borderRadius:2, flexShrink:0 }}/>
            <div>
              <span style={{ color:TTYPES[k].color, fontSize:'11px', fontWeight:'bold' }}>{k} </span>
              <span style={{ color:'#505060', fontSize:'10px' }}>{TTYPES[k].desc}</span>
            </div>
          </div>
        ))}

        <hr style={{ border:'none', borderTop:'1px solid #ffffff11' }}/>
        <div style={{ color:'#404060', fontSize:'10px', lineHeight:1.6 }}>
          Merge 2× same type+tier.<br/>T1+T1→T2 … max T5.
        </div>
      </div>

      {/* Wave modifier modal */}
      {modal && (
        <div style={ss.modalOverlay}>
          <div style={ss.modalBox}>
            <div style={ss.modalTitle}>
              {wave === 0 ? '⬡ CHOOSE WAVE 1 MODIFIER' : `⬡ WAVE ${wave + 1} MODIFIER`}
            </div>
            {modal.choices.map(m => (
              <div key={m.id} style={ss.choiceCard(m.color)}
                onClick={() => pickModifier(m)}
                onMouseEnter={e => e.currentTarget.style.borderColor = m.color+'99'}
                onMouseLeave={e => e.currentTarget.style.borderColor = m.color+'44'}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ fontSize:'24px', width:'36px', textAlign:'center' }}>{m.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:m.color, fontWeight:'bold', fontSize:'13px', letterSpacing:'1px' }}>{m.name}</div>
                    {m.bad && <div style={{ color:'#ff335599', fontSize:'12px', marginTop:'2px' }}>{m.bad}</div>}
                    {m.good && <div style={{ color:'#00ff9988', fontSize:'12px', marginTop:'1px' }}>{m.good}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
