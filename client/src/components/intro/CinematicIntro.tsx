import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntroStore } from '@/store/introStore';

interface CinematicIntroProps {
  onComplete: () => void;
}

// ── Particle canvas renderer ──────────────────────────────────────────────────
function ParticleCanvas({ phase }: { phase: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  type Particle = {
    x: number; y: number;
    vx: number; vy: number;
    alpha: number; size: number;
    life: number; maxLife: number;
    hue: number;
    targetX?: number; targetY?: number;
    converging?: boolean;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const count = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 8000));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.1,
      size: Math.random() * 1.5 + 0.5,
      life: Math.random() * 200,
      maxLife: 200 + Math.random() * 200,
      hue: 145 + Math.random() * 30,
    }));

    function draw() {
      if (!canvas || !ctx) return;
      timeRef.current += 1;
      const t = timeRef.current;

      // Fade trail
      ctx.fillStyle = 'rgba(8, 10, 9, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      particlesRef.current.forEach((p) => {
        p.life += 1;
        if (p.life > p.maxLife) {
          // Respawn
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 0;
          p.converging = false;
        }

        if (phase >= 2 && !p.converging) {
          // Phase 2: converge toward center
          p.converging = true;
          p.targetX = cx + (Math.random() - 0.5) * 200;
          p.targetY = cy + (Math.random() - 0.5) * 150;
        }

        if (p.converging && p.targetX !== undefined && p.targetY !== undefined) {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx += dx * 0.003;
          p.vy += dy * 0.003;
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else {
          // Gentle drift
          p.vx += Math.sin(t * 0.01 + p.y * 0.003) * 0.01;
          p.vy += Math.cos(t * 0.008 + p.x * 0.003) * 0.01;
          p.vx *= 0.99;
          p.vy *= 0.99;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce at edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const lifeRatio = p.life / p.maxLife;
        const alpha = p.alpha * Math.sin(lifeRatio * Math.PI) * (phase >= 2 ? 1.2 : 0.8);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 55%, ${alpha})`;
        ctx.fill();
      });

      // Sweeping light trail in phase 1
      if (phase === 1) {
        const sweep = ((t * 0.3) % (canvas.width + 400)) - 200;
        const grad = ctx.createLinearGradient(sweep - 80, 0, sweep + 80, 0);
        grad.addColorStop(0, 'rgba(53, 208, 127, 0)');
        grad.addColorStop(0.5, 'rgba(53, 208, 127, 0.06)');
        grad.addColorStop(1, 'rgba(53, 208, 127, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    // Clear to black first
    ctx.fillStyle = '#080A09';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

// ── Floating document SVG ─────────────────────────────────────────────────────
function FloatingDocument({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Document card */}
            <motion.div
              className="relative w-56 h-72 rounded-2xl border border-emerald/30 bg-bg-surface/80 backdrop-blur-sm overflow-hidden"
              initial={{ scale: 0.6, rotateX: 20, rotateY: -10 }}
              animate={{ scale: 1, rotateX: 5, rotateY: 5 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ perspective: 600, transformStyle: 'preserve-3d' }}
            >
              {/* Header stripe */}
              <div className="h-12 bg-gradient-to-r from-emerald/20 to-emerald/5 border-b border-emerald/20 flex items-center px-4 gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald/20 border border-emerald/30 flex items-center justify-center">
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                    <path d="M6 1L2 3v5c0 2.1 1.7 4.1 4 4.4C8.3 12.1 10 10.1 10 8V3L6 1z" fill="none" stroke="#35D07F" strokeWidth="1.2"/>
                    <path d="M4.5 6.5l1 1 2-2" stroke="#35D07F" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="h-1.5 w-16 bg-warm-white/30 rounded-full" />
                  <div className="h-1 w-10 bg-warm-white/15 rounded-full mt-1" />
                </div>
              </div>

              {/* Content lines */}
              <div className="p-4 space-y-3">
                {[1, 0.7, 0.85, 0.6, 0.75].map((w, i) => (
                  <motion.div
                    key={i}
                    className="h-2 bg-warm-white/10 rounded-full"
                    style={{ width: `${w * 100}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                  />
                ))}

                {/* QR code placeholder */}
                <motion.div
                  className="mt-4 w-16 h-16 mx-auto border border-emerald/30 rounded-lg bg-emerald/5 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.6, duration: 0.4 }}
                >
                  <svg viewBox="0 0 24 24" className="w-10 h-10 opacity-60" fill="none">
                    <rect x="2" y="2" width="8" height="8" rx="1" stroke="#35D07F" strokeWidth="1.5"/>
                    <rect x="4" y="4" width="4" height="4" fill="#35D07F" opacity="0.5"/>
                    <rect x="14" y="2" width="8" height="8" rx="1" stroke="#35D07F" strokeWidth="1.5"/>
                    <rect x="16" y="4" width="4" height="4" fill="#35D07F" opacity="0.5"/>
                    <rect x="2" y="14" width="8" height="8" rx="1" stroke="#35D07F" strokeWidth="1.5"/>
                    <rect x="4" y="16" width="4" height="4" fill="#35D07F" opacity="0.5"/>
                    <rect x="14" y="14" width="2" height="2" fill="#35D07F"/>
                    <rect x="18" y="14" width="2" height="2" fill="#35D07F"/>
                    <rect x="14" y="18" width="2" height="2" fill="#35D07F"/>
                    <rect x="18" y="18" width="2" height="2" fill="#35D07F"/>
                    <rect x="16" y="16" width="2" height="2" fill="#35D07F" opacity="0.5"/>
                  </svg>
                </motion.div>
              </div>

              {/* Scan line animation */}
              <motion.div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald to-transparent opacity-70"
                initial={{ top: '10%' }}
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
              />

              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald/5 to-transparent pointer-events-none" />
            </motion.div>

            {/* Verification seal */}
            <motion.div
              className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-bg border-2 border-emerald/50 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.5, type: 'spring' }}
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                <path d="M12 2L3 6v7c0 5.25 3.83 10.15 9 11.5C17.17 23.15 21 18.25 21 13V6L12 2z" fill="rgba(53,208,127,0.15)" stroke="#35D07F" strokeWidth="1.5"/>
                <motion.path
                  d="M8.5 12L11 14.5l5-5"
                  stroke="#35D07F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 2.3, duration: 0.5 }}
                />
              </svg>
            </motion.div>

            {/* Orbiting data lines */}
            {[0, 120, 240].map((deg, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-emerald"
                style={{ left: '50%', top: '50%' }}
                animate={{
                  x: [0, Math.cos((deg * Math.PI) / 180) * 140, 0],
                  y: [0, Math.sin((deg * Math.PI) / 180) * 140, 0],
                  opacity: [0, 0.7, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  delay: 1 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main intro component ──────────────────────────────────────────────────────
export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState(1); // 1=signal, 2=document, 3=logo, 4=exit
  const { setHasSeenIntro } = useIntroStore();

  const finish = useCallback(() => {
    setHasSeenIntro(true);
    onComplete();
  }, [setHasSeenIntro, onComplete]);

  useEffect(() => {
    // Check reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      finish();
      return;
    }

    const timings = [
      { delay: 1800, fn: () => setPhase(2) },
      { delay: 4200, fn: () => setPhase(3) },
      { delay: 6500, fn: () => setPhase(4) },
      { delay: 7200, fn: () => finish() },
    ];

    const timers = timings.map(({ delay, fn }) => setTimeout(fn, delay));
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  return (
    <AnimatePresence mode="wait">
      {phase < 4 && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[200] bg-bg overflow-hidden flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Particle canvas */}
          <ParticleCanvas phase={phase} />

          {/* Floating document — phase 2 */}
          <FloatingDocument visible={phase === 2} />

          {/* Logo reveal — phase 3 */}
          <AnimatePresence>
            {phase === 3 && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {/* Wordmark */}
                <div className="relative">
                  {/* Glow */}
                  <motion.div
                    className="absolute inset-0 blur-2xl opacity-30"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="text-[7rem] font-black text-emerald leading-none tracking-[0.15em] select-none">
                      VERITY
                    </div>
                  </motion.div>

                  <motion.h1
                    className="text-[7rem] font-black text-warm-white leading-none tracking-[0.15em] select-none"
                    initial={{ opacity: 0, letterSpacing: '0.4em' }}
                    animate={{ opacity: 1, letterSpacing: '0.15em' }}
                    transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {'VERITY'.split('').map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                        style={{
                          color: char === 'V' ? '#35D07F' : undefined,
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </motion.h1>
                </div>

                {/* Tagline */}
                <motion.p
                  className="mt-4 text-lg text-warm-muted tracking-[0.4em] uppercase font-light"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  Trust, verified.
                </motion.p>

                {/* Decorative line */}
                <motion.div
                  className="mt-6 h-px bg-gradient-to-r from-transparent via-emerald/50 to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          <motion.button
            className="absolute bottom-6 right-6 text-xs text-warm-muted/60 hover:text-warm-muted border border-border/40 hover:border-border px-3 py-1.5 rounded-md transition-all duration-150 backdrop-blur-sm z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={finish}
            aria-label="Skip intro"
          >
            Skip
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
