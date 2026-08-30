import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Terminal,
  PlayCircle,
  Database,
  Zap,
  Server,
  Box,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Static config                                                      */
/* ------------------------------------------------------------------ */

const NODE_COUNT = 3;

const NODE_POS = [
  { x: 84, y: 15 },
  { x: 84, y: 50 },
  { x: 84, y: 85 },
];
const LOCK_POS = { x: 46, y: 50 };
const QUEUE_POS = { x: 11, y: 50 };

const TASK_NAMES = [
  'process_payment',
  'send_email',
  'generate_report',
  'resize_image',
  'sync_inventory',
  'compute_analytics',
  'refresh_cache',
  'export_csv',
];

const TIMING = {
  arrive: 550,
  pulse: 750,
  resolve: 950,
  pull: 700,
  process: 2000,
  complete: 550,
  pause: 450,
};

const STACK = [
  {
    title: 'Java 25 & Spring Boot',
    description: 'Stateless worker fleet, horizontally scaled, competing for locks in a tight polling loop.',
    icon: Server,
    iconBg: 'rgba(56,189,248,0.12)',
    iconColor: '#7dd3fc',
    accentBorder: 'rgba(56,189,248,0.55)',
    accentGlow: 'rgba(56,189,248,0.28)',
  },
  {
    title: 'Redis',
    description: 'Atomic SETNX operations guarantee that only one worker ever holds the lock for a given task.',
    icon: Zap,
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#34d399',
    accentBorder: 'rgba(16,185,129,0.55)',
    accentGlow: 'rgba(16,185,129,0.28)',
  },
  {
    title: 'PostgreSQL',
    description: 'A durable task table tracks every transition: PENDING → PROCESSING → COMPLETE.',
    icon: Database,
    iconBg: 'rgba(56,189,248,0.12)',
    iconColor: '#7dd3fc',
    accentBorder: 'rgba(56,189,248,0.55)',
    accentGlow: 'rgba(56,189,248,0.28)',
  },
  {
    title: 'Docker',
    description: 'Every worker ships as an identical container image, scaled independently of the lock layer.',
    icon: Box,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#fbbf24',
    accentBorder: 'rgba(245,158,11,0.55)',
    accentGlow: 'rgba(245,158,11,0.28)',
  },
];

function lineColor(line) {
  if (!line) return 'rgba(255,255,255,0.7)';
  if (line.includes('Acquired') || line.includes('complete')) return '#34d399';
  if (line.includes('returning to sleep')) return '#fbbf24';
  if (line.includes('Fetched') || line.includes('Processing') || line.includes('enqueued')) return '#7dd3fc';
  return 'rgba(255,255,255,0.7)';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function App() {
  const [phase, setPhase] = useState('arrive');
  const [taskId, setTaskId] = useState(948);
  const [winner, setWinner] = useState(0);
  const [queueTasks, setQueueTasks] = useState([
    { id: 941, name: 'sync_inventory', state: 'idle' },
    { id: 942, name: 'refresh_cache', state: 'idle' },
  ]);
  const [logs, setLogs] = useState([]);
  const [typingText, setTypingText] = useState('');

  const queueRef = useRef([]);
  const typingLockRef = useRef(false);
  const terminalRef = useRef(null);

  // Parallax scroll effects
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.95]);

  const processQueue = useCallback(() => {
    if (typingLockRef.current) return;
    const next = queueRef.current.shift();
    if (next === undefined) return;
    typingLockRef.current = true;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setTypingText(next.slice(0, i));
      if (i >= next.length) {
        clearInterval(iv);
        setLogs((prev) => [...prev, next].slice(-60));
        setTypingText('');
        typingLockRef.current = false;
        setTimeout(processQueue, 60);
      }
    }, 10);
  }, []);

  const pushLog = useCallback((msg) => {
    queueRef.current.push(msg);
    processQueue();
  }, [processQueue]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, typingText]);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    async function runLoop() {
      let idCounter = 947;
      let nameIdx = 0;

      while (!cancelled) {
        idCounter += 1;
        const id = idCounter;
        const name = TASK_NAMES[nameIdx % TASK_NAMES.length];
        nameIdx += 1;

        setPhase('arrive');
        setTaskId(id);
        setQueueTasks((q) => [{ id, name, state: 'entering' }, ...q]);
        await sleep(20);
        if (cancelled) break;
        setQueueTasks((q) => q.map((t) => (t.id === id ? { ...t, state: 'idle' } : t)));
        pushLog(`[Queue] New task enqueued → Task-${id}`);
        await sleep(Math.max(TIMING.arrive - 20, 0));
        if (cancelled) break;

        setPhase('pulse');
        pushLog('[Node-1] Polling queue...');
        pushLog('[Node-2] Polling queue...');
        pushLog('[Node-3] Polling queue...');
        await sleep(TIMING.pulse);
        if (cancelled) break;

        const win = Math.floor(Math.random() * NODE_COUNT);
        setWinner(win);
        setPhase('resolve');
        pushLog(`[Node-${win + 1}] Acquired lock for Task-${id}`);
        [0, 1, 2].filter((n) => n !== win).forEach((n) => pushLog(`[Node-${n + 1}] Lock exists, returning to sleep`));
        await sleep(TIMING.resolve);
        if (cancelled) break;

        setPhase('pull');
        setQueueTasks((q) => q.map((t) => (t.id === id ? { ...t, state: 'exiting' } : t)));
        pushLog(`[Node-${win + 1}] Fetched Task-${id} from Postgres`);
        await sleep(300);
        if (cancelled) break;
        setQueueTasks((q) => q.filter((t) => t.id !== id));
        await sleep(Math.max(TIMING.pull - 300, 0));
        if (cancelled) break;

        setPhase('process');
        pushLog(`[Node-${win + 1}] Processing Task-${id}...`);
        await sleep(TIMING.process);
        if (cancelled) break;

        setPhase('complete');
        pushLog(`[Node-${win + 1}] Task-${id} complete — lock released`);
        await sleep(TIMING.complete);
        if (cancelled) break;

        await sleep(TIMING.pause);
      }
    }

    runLoop();
    return () => { cancelled = true; };
  }, [pushLog]);

  const lockHeld = phase === 'resolve' || phase === 'pull' || phase === 'process';

  function getNodeVisual(i) {
    if (phase === 'pulse') return { ring: true, glow: 'blue', label: 'racing for lock', dim: false };
    if (phase === 'resolve') {
      if (i === winner) return { glow: 'emerald', label: 'lock acquired', badge: { text: 'SETNX → 1', color: 'emerald' } };
      return { glow: 'amber', label: 'backing off', badge: { text: 'SETNX → 0', color: 'amber' } };
    }
    if (phase === 'pull') return i === winner ? { glow: 'blue', label: 'fetching task' } : { dim: true, label: 'sleeping' };
    if (phase === 'process') return i === winner ? { glow: 'blue', label: 'processing', spinner: true } : { dim: true, label: 'sleeping' };
    if (phase === 'complete') return i === winner ? { glow: 'emerald', label: 'lock released', done: true } : { dim: true, label: 'sleeping' };
    return { label: 'listening' };
  }

  const glowColors = {
    blue: { border: 'rgba(56,189,248,0.65)', shadow: '0 0 30px rgba(56,189,248,0.32)' },
    emerald: { border: 'rgba(16,185,129,0.65)', shadow: '0 0 30px rgba(16,185,129,0.35)' },
    amber: { border: 'rgba(245,158,11,0.6)', shadow: '0 0 30px rgba(245,158,11,0.3)' },
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased overflow-hidden" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); } 60% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes ringPulse { 0% { transform: scale(0.85); opacity: 0.8; } 100% { transform: scale(2.1); opacity: 0; } }
        @keyframes ambientGlow { 0%, 100% { box-shadow: 0 0 30px 4px rgba(56,189,248,0.22), 0 0 0 1px rgba(56,189,248,0.28) inset; } 50% { box-shadow: 0 0 55px 10px rgba(56,189,248,0.38), 0 0 0 1px rgba(56,189,248,0.42) inset; } }
        @keyframes ambientGlowHeld { 0%, 100% { box-shadow: 0 0 35px 6px rgba(16,185,129,0.32), 0 0 0 1px rgba(16,185,129,0.4) inset; } 50% { box-shadow: 0 0 60px 12px rgba(16,185,129,0.48), 0 0 0 1px rgba(16,185,129,0.55) inset; } }
        @keyframes blinkCursor { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        @keyframes dashFlow { to { stroke-dashoffset: -24; } }
        .cs-glass { background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)); border: 1px solid rgba(255,255,255,0.09); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .cs-gradient-text { background: linear-gradient(180deg, #ffffff 10%, #93d9ff 55%, #2563eb 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
      `}</style>

      {/* Slide 1: The Hero Slide */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative h-screen flex flex-col items-center justify-center sticky top-0"
      >
        <motion.div
          style={{ y: backgroundY }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none blur-[100px]"
          style={{ background: 'rgba(56,189,248,0.15)' }}
        />

        <div className="relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.3)]" style={{ background: 'linear-gradient(135deg,#7dd3fc,#2563eb)' }}>
              <RefreshCw className="w-8 h-8 text-black" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-7xl sm:text-9xl font-bold tracking-tighter cs-gradient-text mb-4"
          >
            ChronoSync
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-sm md:text-lg text-sky-200/50 tracking-[0.2em] uppercase font-mono"
          >
            Distributed Lock Orchestrator
          </motion.p>
        </div>

        {/* Bouncing Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1, duration: 2, repeat: Infinity }}
          className="absolute bottom-12 flex flex-col items-center gap-3 text-white/30"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-sky-200/40">Scroll to initialize</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-sky-400/50 to-transparent" />
        </motion.div>
      </motion.section>

      {/* Slide 2: The Simulation */}
      <section className="relative z-10 bg-black pt-24 pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-400/5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" style={{ animation: 'blinkCursor 1.6s ease-in-out infinite' }} />
              <span className="text-xs font-mono tracking-wide text-sky-200/60">SIMULATION LIVE</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Only one worker wins the lock.</h2>
            <p className="max-w-xl mx-auto text-base text-white/50">
              When a task lands, all nodes race to acquire the mutex — Redis's atomic SETNX guarantees exactly one winner.
            </p>
          </motion.div>

          {/* Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="overflow-x-auto -mx-2 px-2 mb-8"
          >
            <div className="relative rounded-3xl cs-glass overflow-hidden mx-auto border-white/10" style={{ width: '100%', minWidth: 640, aspectRatio: '2.15 / 1' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)' }} />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1={QUEUE_POS.x} y1={QUEUE_POS.y} x2={LOCK_POS.x} y2={LOCK_POS.y} stroke="rgba(125,211,252,0.28)" strokeWidth="0.3" strokeDasharray="1.4 1.6" style={{ animation: 'dashFlow 1.3s linear infinite' }} />
                {NODE_POS.map((p, i) => (
                  <line key={i} x1={p.x} y1={p.y} x2={LOCK_POS.x} y2={LOCK_POS.y} stroke="rgba(125,211,252,0.22)" strokeWidth="0.3" strokeDasharray="1.4 1.6" style={{ animation: 'dashFlow 1.3s linear infinite' }} />
                ))}
              </svg>

              {/* pulse dots */}
              {[0, 1, 2].map((i) => (
                <div key={`dot-${i}`} className="absolute w-2.5 h-2.5 rounded-full pointer-events-none" style={{ left: phase === 'pulse' ? `${LOCK_POS.x}%` : `${NODE_POS[i].x}%`, top: phase === 'pulse' ? `${LOCK_POS.y}%` : `${NODE_POS[i].y}%`, opacity: phase === 'pulse' ? 1 : 0, transform: 'translate(-50%,-50%)', background: '#7dd3fc', boxShadow: '0 0 12px 3px rgba(125,211,252,0.9)', transition: phase === 'pulse' ? `left ${TIMING.pulse}ms cubic-bezier(0.22,1.4,0.36,1), top ${TIMING.pulse}ms cubic-bezier(0.22,1.4,0.36,1), opacity 150ms` : 'none' }} />
              ))}
              <div className="absolute w-2.5 h-2.5 rounded-full pointer-events-none" style={{ left: phase === 'pull' ? `${NODE_POS[winner].x}%` : `${QUEUE_POS.x}%`, top: phase === 'pull' ? `${NODE_POS[winner].y}%` : `${QUEUE_POS.y}%`, opacity: phase === 'pull' ? 1 : 0, transform: 'translate(-50%,-50%)', background: '#34d399', boxShadow: '0 0 12px 3px rgba(52,211,153,0.9)', transition: phase === 'pull' ? `left ${TIMING.pull}ms cubic-bezier(0.22,1.4,0.36,1), top ${TIMING.pull}ms cubic-bezier(0.22,1.4,0.36,1), opacity 150ms` : 'none' }} />

              {/* Queue */}
              <div className="absolute" style={{ left: `${QUEUE_POS.x}%`, top: `${QUEUE_POS.y}%`, transform: 'translate(-50%,-50%)' }}>
                <div className="w-40 sm:w-48 rounded-2xl cs-glass border px-4 py-3 border-white/10 bg-black/40">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Database className="w-4 h-4 text-sky-400" />
                    <p className="text-xs font-semibold text-white/85">task_queue</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {queueTasks.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-mono bg-white/5" style={{ transition: 'opacity 300ms ease, transform 300ms ease', opacity: t.state === 'entering' || t.state === 'exiting' ? 0 : 1, transform: t.state === 'entering' ? 'translateY(-6px)' : t.state === 'exiting' ? 'translateX(18px)' : 'translate(0,0)' }}>
                        <span className="text-white/70">#{t.id}</span>
                        <span className="text-white/40">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lock */}
              <div className="absolute" style={{ left: `${LOCK_POS.x}%`, top: `${LOCK_POS.y}%`, transform: 'translate(-50%,-50%)' }}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(56,189,248,0.25), rgba(0,0,0,0.6))', borderColor: lockHeld ? 'rgba(16,185,129,0.7)' : 'rgba(56,189,248,0.6)', animation: lockHeld ? 'ambientGlowHeld 2.2s ease-in-out infinite' : 'ambientGlow 2.6s ease-in-out infinite', transition: 'border-color 400ms' }}>
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: lockHeld ? '#34d399' : '#7dd3fc' }} />
                </div>
              </div>

              {/* Nodes */}
              {[0, 1, 2].map((i) => {
                const v = getNodeVisual(i);
                const g = v.glow ? glowColors[v.glow] : null;
                return (
                  <div key={i} className="absolute" style={{ left: `${NODE_POS[i].x}%`, top: `${NODE_POS[i].y}%`, transform: 'translate(-50%,-50%)' }}>
                    {v.ring && <span className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: '1px solid rgba(56,189,248,0.8)', animation: 'ringPulse 0.9s ease-out infinite' }} />}
                    {v.badge && (
                      <div className="absolute left-1/2 px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap" style={{ top: '-2rem', transform: 'translate(-50%, -50%)', animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)', background: v.badge.color === 'emerald' ? 'rgba(16,185,129,0.16)' : 'rgba(245,158,11,0.16)', color: v.badge.color === 'emerald' ? '#34d399' : '#fbbf24', border: `1px solid ${v.badge.color === 'emerald' ? 'rgba(16,185,129,0.45)' : 'rgba(245,158,11,0.45)'}` }}>
                        {v.badge.text}
                      </div>
                    )}
                    <div className="w-28 sm:w-36 rounded-2xl cs-glass border px-3 sm:px-4 py-3 flex flex-col items-center gap-2 bg-black/40" style={{ transition: 'opacity 400ms, border-color 400ms, box-shadow 400ms', opacity: v.dim ? 0.4 : 1, borderColor: g ? g.border : 'rgba(255,255,255,0.09)', boxShadow: g ? g.shadow : 'none' }}>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-sky-400/10">
                        {v.spinner ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : v.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Server className="w-4 h-4 text-sky-400" />}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-white/90">Worker-{i + 1}</p>
                        <p className="text-xs font-mono text-white/45">{v.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="rounded-2xl cs-glass border overflow-hidden border-white/10 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs font-mono text-white/45">worker-fleet — bash — 92×24</span>
            </div>
            <div ref={terminalRef} className="px-5 py-4 font-mono text-xs sm:text-sm leading-relaxed h-64 overflow-y-auto bg-black/60">
              {logs.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap" style={{ color: lineColor(line) }}><span className="text-white/30">$ </span>{line}</div>
              ))}
              <div className="whitespace-pre-wrap" style={{ color: lineColor(typingText) }}>
                <span className="text-white/30">$ </span>{typingText}
                <span style={{ display: 'inline-block', width: 6, height: 14, background: '#7dd3fc', marginLeft: 2, animation: 'blinkCursor 1s step-start infinite', verticalAlign: '-2px' }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Slide 3: The Tech Stack */}
      <section className="relative z-10 bg-black pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono tracking-widest mb-3 text-sky-400 uppercase">Architecture</p>
            <h2 className="text-4xl font-bold">Built for correctness at scale.</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {STACK.map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="rounded-2xl cs-glass border p-8 border-white/10 cursor-pointer hover:shadow-[0_0_45px_var(--accent-glow)] hover:border-[var(--accent-border)] transition-all duration-300 bg-black/40"
                style={{ '--accent-border': s.accentBorder, '--accent-glow': s.accentGlow }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: s.iconBg }}>
                  <s.icon className="w-6 h-6" style={{ color: s.iconColor }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}