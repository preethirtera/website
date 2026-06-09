import { useState, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Hero — landing section for Preethi's portfolio.
 *
 * Waiting state (pre-click): nav hidden above the screen, text on the left,
 * bubbles hidden, the Olive video playing inside its blue blob on the right.
 *
 * Click anywhere → `.is-active`:
 *   1. the left text block slides to the centre of the viewport,
 *   2. the global nav bar drops down from the top,
 *   3. the right side implodes LOCALLY — the video gets sucked into the blue
 *      blob (which stays anchored in its lane), then the blob pops into small
 *      blue bubbles that scatter around that spot and fade.
 *
 * Setup: place `olive-tagged.mp4` (+ poster) in /public or pass the props.
 */

const COLORS = {
  cream: "#FFEDA1",
  red: "#FF2E2E",
  brown: "#372020",
  blue: "#9FBFFF",
  pink: "#FFA9A9",
};

const LINES = [
  { text: "Hi, I’m Preethi.", className: "hero-headline", render: () => <>Hi, I&rsquo;m Preethi.</> },
  {
    text: "I design digital products and the spatial environments they live inside…",
    className: "hero-subtitle",
    render: () => <>I design digital products and the spatial environments they live inside&hellip;</>,
  },
  {
    text: "Fluent in both pixels and plans",
    className: "hero-tagline",
    render: () => (<>Fluent in both <em>pixels</em> and <em>plans</em></>),
  },
];

const TYPE_SPEED = 45;
const LINE_PAUSE = 350;

// arriving via "Home" → skip the intro and land on the settled, centered frame
const INSTANT = typeof window !== "undefined" &&
  (window.location.search.indexOf("home") > -1 || window.location.hash === "#home");

export default function Hero({
  videoSrc = "/olive-tagged.mp4",
  poster = "/olive-tagged-poster.jpg",
  onGetInTouch = () => { window.location.href = "contact.html"; },
  onViewProjects = () => { window.location.href = "projects.html"; },
}) {
  const [lineIndex, setLineIndex] = useState(INSTANT ? LINES.length - 1 : 0);
  const [charCount, setCharCount] = useState(INSTANT ? LINES[LINES.length - 1].text.length : 0);
  const [done, setDone] = useState(INSTANT);
  const [active, setActive] = useState(INSTANT);   // click anywhere → fire the whole sequence
  const timer = useRef(null);
  const leftRef = useRef(null);
  const videoRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const autoplayRef = useRef(null);
  const oliveRunnerRef = useRef(null), oliveViewRef = useRef(null), oliveStripRef = useRef(null);

  // CLICK = fast-forward: cancel the auto timer and fire immediately (skip the wait)
  const activate = () => {
    if (active) return;
    clearTimeout(autoplayRef.current);
    setActive(true);
  };

  // Olive: 8.5s loop — run in (0–30%) → sit & wag (30–70%) → run off (70–100%).
  // Movement matches that exact timeline; leg cadence is derived from the run speed so paws grip.
  useEffect(() => {
    const runner = oliveRunnerRef.current, strip = oliveStripRef.current, view = oliveViewRef.current;
    if (!runner || !strip || !view) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { runner.style.display = 'none'; return; }
    const FW = 363, RUN0 = 0, SITDN0 = 12, SIT0 = 20, SITN = 12;   // frame width + sprite group starts + sit count
    const PER_FRAME = 4.67, SIT_FPS = 6;                           // measured px/run-frame + wag cadence
    // ----- timeline (bigger T_IN/T_OUT = slower run + smoother legs near native 12fps) -----
    const T_IN = 11000;                 // run in
    const SD = 550, SH = 2600, SU = 550; // sit-down + wag-hold + stand-up
    const T_OUT = 11000;                // run off (keep == T_IN for matched in/out speed)
    const TOTAL = T_IN + SD + SH + SU + T_OUT; // = 8500ms
    const t1 = T_IN, t2 = t1 + SD, t3 = t2 + SH, t4 = t3 + SU;
    let boxVis = view.getBoundingClientRect().width || 207;
    const onResize = () => { boxVis = view.getBoundingClientRect().width || 207; };
    window.addEventListener('resize', onResize);
    const setFrame = f => { strip.style.transform = 'translateX(' + (-f * FW) + 'px)'; };
    const setX = x => { runner.style.transform = 'translateX(' + x + 'px)'; };
    let raf, start = performance.now();
    const tick = now => {
      const W = window.innerWidth, startX = -(boxVis + 40), centerX = W / 2 - boxVis / 2, endX = W + 40;
      const Din = centerX - startX, Dout = endX - centerX, t = (now - start) % TOTAL;
      if (t < t1) {                       // run in (constant speed)
        const p = t / T_IN; setX(startX + Din * p);
        const fps = (Din / (T_IN / 1000)) / PER_FRAME;     // leg cadence locked to ground speed
        setFrame(RUN0 + Math.floor((t / 1000) * fps) % 12);
      } else if (t < t2) { setX(centerX); setFrame(SITDN0 + Math.min(7, Math.floor(((t - t1) / SD) * 8))); }
      else if (t < t3) { setX(centerX); setFrame(SIT0 + Math.floor(((t - t2) / 1000) * SIT_FPS) % SITN); }
      else if (t < t4) { setX(centerX); setFrame((SITDN0 + 7) - Math.min(7, Math.floor(((t - t3) / SU) * 8))); }
      else {                              // run off (constant speed)
        const tp = t - t4, p = tp / T_OUT; setX(centerX + Dout * p);
        const fps = (Dout / (T_OUT / 1000)) / PER_FRAME;
        setFrame(RUN0 + Math.floor((tp / 1000) * fps) % 12);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  // AUTO-PLAY: even without a click, fire the burst once the text finishes + a short
  // beat, so the intro never just sits there waiting
  useEffect(() => {
    if (!done || active) return;
    autoplayRef.current = setTimeout(() => setActive(true), 6000);
    return () => clearTimeout(autoplayRef.current);
  }, [done, active]);

  // the global nav stays hidden over the hero and only drops in once the user scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // slide the text block to the horizontal centre of the viewport (grid untouched,
  // so the blob stays exactly in its right-hand lane)
  useLayoutEffect(() => {
    if (!active || !leftRef.current) return;
    const el = leftRef.current;
    const rect = el.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2);
    el.style.transition = INSTANT ? "none" : "transform 1.2s cubic-bezier(0.65, 0, 0.35, 1)"; // smooth ease-in-out
    el.style.transform = `translateX(${dx}px)`;
  }, [active]);

  // a few ambient bubbles that occasionally linger & pop (usually 1–2 on screen,
  // sometimes none) — long cycles with big gaps so they're sparse, not a stream
  const ambient = [
    { top: 22, left: 13, size: 24, dx: 16,  dur: 18, delay: 0.3 },
    { top: 66, left: 84, size: 16, dx: -14, dur: 22, delay: 1.9 },
    { top: 38, left: 92, size: 20, dx: 10,  dur: 16, delay: 0.9 },
    { top: 78, left: 21, size: 18, dx: -10, dur: 24, delay: 2.7 },
    { top: 50, left: 6,  size: 14, dx: 12,  dur: 21, delay: 1.4 },
  ];

  // local blue bubbles that scatter around the blob's spot after it pops
  const particles = Array.from({ length: 22 }, (_, i) => {
    const ang = (i / 22) * Math.PI * 2 + (i % 4);
    const dist = 30 + ((i * 53) % 130); // 30–160px — local scatter
    return {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      size: 8 + ((i * 7) % 16), // small bubbles
      delay: ((i * 13) % 28) / 280, // tight 0–0.1s stagger
      dur: 1.0 + ((i * 13) % 70) / 100,
    };
  });

  // typing
  useEffect(() => {
    if (done) return;
    const current = LINES[lineIndex];
    if (charCount < current.text.length) {
      timer.current = setTimeout(() => setCharCount((c) => c + 1), TYPE_SPEED);
    } else if (lineIndex < LINES.length - 1) {
      timer.current = setTimeout(() => { setLineIndex((l) => l + 1); setCharCount(0); }, LINE_PAUSE);
    } else {
      timer.current = setTimeout(() => setDone(true), LINE_PAUSE);
    }
    return () => clearTimeout(timer.current);
  }, [charCount, lineIndex, done]);

  return (
    <section className={`hero ${active ? "is-active" : ""} ${scrolled ? "scrolled" : ""} ${done && !active ? "ready" : ""} ${INSTANT ? "instant" : ""}`} onClick={activate}>
      <style>{css}</style>

      <header className="global-bar">
        <nav className="global-nav">
          <a href="?home">Home</a>
          <a href="about.html">About</a>
          <a href="coming-soon.html">Work</a>
          <a href="coming-soon.html">Play</a>
          <a href="contact.html">Contact</a>
        </nav>
      </header>

      {/* ambient bubbles drifting up the page, popping now & then */}
      <div className="ambient" aria-hidden="true">
        {ambient.map((b, i) => (
          <span
            key={i}
            className="amb-bubble"
            style={{
              top: `${b.top}%`,
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              "--adx": `${b.dx}px`,
              "--adur": `${b.dur}s`,
              "--adelay": `${b.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="hero-inner">
        {/* LEFT — typed copy + buttons (slides to centre on click) */}
        <div className="hero-left" ref={leftRef}>
          {LINES.map((line, i) => {
            const isPast = i < lineIndex || done;
            const isActive = i === lineIndex && !done;
            if (i > lineIndex && !done) return null;
            return (
              <p key={i} className={line.className}>
                {isPast ? line.render() : line.text.slice(0, charCount)}
                {isActive && <span className="caret" aria-hidden="true" />}
              </p>
            );
          })}
          <div className={`hero-actions ${done ? "show" : ""}`}>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onGetInTouch(); }}>Get in touch</button>
            <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); onViewProjects(); }}>View Projects</button>
          </div>
        </div>

        {/* RIGHT — stays in its lane: video implodes into the blob, blob pops locally */}
        <div className="hero-right">
          <span className="video-blob" aria-hidden="true" />
          <div className="video-frame">
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              autoPlay
              muted
              playsInline
              aria-label="Preethi and her dog Olive"
            />
          </div>
          {/* bubbles scatter locally around this spot */}
          <div className="particle-layer" aria-hidden="true">
            {particles.map((p, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  width: p.size,
                  height: p.size,
                  "--x": `${p.x}px`,
                  "--y": `${p.y}px`,
                  "--delay": `${p.delay}s`,
                  "--dur": `${p.dur}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Olive runs in, sits & wags in the centre, then runs off (transparent sprite) */}
      <div className="olive-runner" ref={oliveRunnerRef} aria-hidden="true">
        <div className="olive-viewport" ref={oliveViewRef}><div className="olive-strip" ref={oliveStripRef} /></div>
      </div>
    </section>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700&display=swap');

.hero {
  --cream: ${COLORS.cream};
  --red: ${COLORS.red};
  --brown: ${COLORS.brown};
  --blue: ${COLORS.blue};
  --pink: ${COLORS.pink};
  font-family: 'Poppins', system-ui, sans-serif;
  background: var(--cream);
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: clamp(24px, 5vw, 72px);
  overflow: hidden;
  cursor: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='36'%20height='36'%20viewBox='0%200%2036%2036'%3E%3Cpath%20d='M7%204%20L7%2027%20L13%2021%20L16.5%2029%20L20%2027.3%20L16.5%2019.5%20L23%2019.5%20Z'%20fill='%23FFFFFF'%20stroke='%23372020'%20stroke-width='2.4'%20stroke-linejoin='round'%20stroke-linecap='round'/%3E%3C/svg%3E") 7 4, auto;
}

.hero-inner {
  position: relative;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(32px, 5vw, 72px);
  align-items: center;
}

/* ---------- LEFT ---------- */
.hero-left { min-width: 0; position: relative; z-index: 4; will-change: transform; }
.is-active .hero-left { text-align: center; }
.is-active .hero-subtitle, .is-active .hero-tagline { max-width: none; }
.is-active .hero-actions { justify-content: center; }

.hero-headline {
  margin: 0 0 18px; color: var(--red); font-weight: 800;
  font-size: clamp(40px, 6vw, 76px); line-height: 1.02; letter-spacing: -0.5px; min-height: 1.02em;
}
.hero-subtitle {
  margin: 0 0 10px; color: #D9534A; font-weight: 500;
  font-size: clamp(16px, 1.7vw, 21px); line-height: 1.45; max-width: 30ch;
}
.hero-tagline { margin: 0; color: var(--brown); font-weight: 500; font-size: clamp(16px, 1.7vw, 21px); }
.hero-tagline em { font-style: italic; font-weight: 700; color: var(--red); }

.caret {
  display: inline-block; width: 3px; height: 1em; margin-left: 4px; vertical-align: -0.12em;
  background: currentColor; border-radius: 2px; animation: blink 0.9s steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }

/* ---------- BUTTONS ---------- */
.hero-actions {
  display: flex; flex-wrap: wrap; gap: 16px; margin-top: 38px;
  opacity: 0; transform: translateY(14px); pointer-events: none;
}
.hero-actions.show {
  opacity: 1; transform: translateY(0); pointer-events: auto;
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.hero-actions.show .btn { animation: pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
.hero-actions.show .btn:nth-child(2) { animation-delay: 0.12s; }
@keyframes pop {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.btn {
  font-family: inherit; font-weight: 700; font-size: clamp(15px, 1.4vw, 18px);
  padding: 15px 28px; border-radius: 999px; border: 2.5px solid var(--brown);
  cursor: pointer; color: var(--brown);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.btn-primary { background: var(--blue); }
.btn-secondary { background: #fff; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 var(--brown); }
.btn:active { transform: translateY(0); box-shadow: 0 2px 0 var(--brown); }

/* ---------- RIGHT / VIDEO (stays in its lane) ---------- */
.hero-right { position: relative; display: flex; justify-content: center; align-items: center; z-index: 1; }
.video-blob {
  position: absolute; inset: -6% -4% auto auto; width: 78%; height: 92%;
  background: var(--blue); border-radius: 42% 58% 55% 45% / 50% 45% 55% 50%;
  transform: rotate(-6deg) scale(0.8); z-index: 0;
  animation: blobGrow 4.5s cubic-bezier(0.45, 0, 0.65, 1) forwards;
}
@keyframes blobGrow {
  0%   { transform: rotate(-6deg) scale(0.8); }
  55%  { transform: rotate(-4deg) scale(1.1); }
  100% { transform: rotate(-4deg) scale(1.35); }
}
/* once the intro settles, the blob beats like a heartbeat — a cue to click */
.ready .video-blob {
  animation: heartbeat 1.5s ease-in-out infinite;
}
@keyframes heartbeat {
  0%, 100% { transform: rotate(-4deg) scale(1.35); }
  12%      { transform: rotate(-4deg) scale(1.5); }   /* lub */
  24%      { transform: rotate(-4deg) scale(1.35); }
  36%      { transform: rotate(-4deg) scale(1.46); }  /* dub */
  50%      { transform: rotate(-4deg) scale(1.35); }
}
.video-frame {
  position: relative; z-index: 1; width: 100%; max-width: 460px; aspect-ratio: 4 / 3;
  border: 4px solid var(--brown); border-radius: 26px; overflow: hidden;
  background: var(--brown); box-shadow: 10px 12px 0 var(--brown); transform: rotate(2deg);
}
.video-frame video { width: 100%; height: 100%; object-fit: cover; display: block; }

/* WATER-BUBBLE IMPLOSION — the video is drawn into the blob's centre (fluid easing) */
.is-active .video-frame {
  pointer-events: none;
  transform-origin: 70% 30%;                      /* toward the blob, top-right */
  animation: suckIn 0.32s cubic-bezier(0.5, 0, 0.8, 0) forwards;  /* quick accel to 0 */
}
@keyframes suckIn {
  0%   { transform: rotate(2deg) scale(1); opacity: 1; }
  100% { transform: rotate(0deg) scale(0); opacity: 0; }
}

/* LOCALIZED POP — overlaps the suck (no second beat); one quick scale-up + vanish */
.is-active .video-blob {
  animation: blobPopLocal 0.26s cubic-bezier(0.3, 0, 0.45, 1) 0.24s forwards;
}
@keyframes blobPopLocal {
  0%   { transform: rotate(-3deg) scale(1.35); opacity: 1; }
  100% { transform: rotate(-3deg) scale(1.95); opacity: 0; }
}

/* ---------- LOCAL BUBBLE SCATTER (around the right-side spot) ---------- */
.particle-layer {
  position: absolute;
  top: 46%;
  left: 52%;
  width: 0; height: 0;
  z-index: 2;
  pointer-events: none;
}
.particle {
  position: absolute; left: 0; top: 0; box-sizing: border-box; border-radius: 50%;
  background: #AFCBFF; border: 2px solid var(--brown);
  opacity: 0; transform: translate(0, 0) scale(0);
}
.particle::before {
  content: ""; position: absolute; top: 16%; left: 18%; width: 36%; height: 28%;
  background: #fff; border-radius: 50%; transform: rotate(-22deg);
}
/* bubbles burst out of the pop spot, scatter locally, fade to 0 */
.is-active .particle {
  animation: floatOut var(--dur) cubic-bezier(0.2, 0.6, 0.3, 1) calc(0.38s + var(--delay)) forwards;
}
@keyframes floatOut {
  0%   { transform: translate(0,0) scale(0.2);              opacity: 0; }
  15%  { opacity: 0.9; }
  70%  { opacity: 0.9; }
  100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; }
}

/* ---------- AMBIENT BUBBLES (idle: drift up the page & pop now and then) ---------- */
.ambient { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.amb-bubble {
  --aop: 0.8;
  position: absolute;
  box-sizing: border-box;
  border-radius: 50%;
  background: #AFCBFF;
  border: 2px solid var(--brown);
  opacity: 0;
  /* no bubbles while idle */
}
/* bubbles only appear AFTER the blob pops, then linger around at 80% */
.is-active .amb-bubble {
  animation: ambientDrift var(--adur) ease-in-out calc(0.5s + var(--adelay)) infinite;
}
.amb-bubble::before {
  content: ""; position: absolute; top: 16%; left: 20%; width: 32%; height: 26%;
  background: rgba(255, 255, 255, 0.7); border-radius: 50%;
}
/* appears, gently lingers, swells & pops — then a long invisible gap before it returns */
@keyframes ambientDrift {
  0%   { opacity: 0;          transform: translate(0, 0)              scale(0.4); }
  10%  { opacity: var(--aop); transform: translate(0, -6px)          scale(1);   }
  30%  { opacity: var(--aop); transform: translate(var(--adx), -30px) scale(1.02); }
  38%  { opacity: var(--aop); transform: translate(var(--adx), -38px) scale(1.2); }  /* swell */
  44%  { opacity: 0;          transform: translate(var(--adx), -42px) scale(1.5); }  /* pop */
  100% { opacity: 0;          transform: translate(var(--adx), -42px) scale(1.5); }  /* gap */
}

/* ---------- GLOBAL BAR (hidden over the hero; slides down only on scroll) ---------- */
.global-bar {
  position: fixed; top: 0; left: 0; right: 0; height: 64px;
  background: #372020; transform: translateY(-100%); z-index: 90;
  box-shadow: 0 4px 12px rgba(55, 32, 32, 0.22);
  transition: transform 0.45s cubic-bezier(0.33, 1, 0.5, 1);
  display: flex; align-items: center; justify-content: flex-end;
  padding: 0 clamp(24px, 5vw, 72px);
}
.global-nav { display: flex; gap: clamp(22px, 2.5vw, 38px); }
.global-nav a {
  position: relative;
  color: rgba(255, 237, 161, 0.72);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  text-decoration: none;
  transition: color 0.25s ease;
}
.global-nav a::after {
  content: ""; position: absolute; left: 0; bottom: -5px;
  height: 1px; width: 0; background: var(--cream);
  transition: width 0.25s ease;
}
.global-nav a:hover { color: var(--cream); }
.global-nav a:hover::after { width: 100%; }
/* only once the hero has settled (centered) does scrolling drop the bar */
.is-active.scrolled .global-bar { transform: translateY(0); }

/* ---------- OLIVE RUNNER (transparent sprite, JS-driven) ---------- */
.olive-runner { position: absolute; left: 0; bottom: 6px; z-index: 3; pointer-events: none; will-change: transform; transform: translateX(-9999px); }
.olive-viewport { width: 363px; height: 240px; overflow: hidden; transform: scale(0.58); transform-origin: left bottom; }
.olive-strip { width: 11616px; height: 240px; background: url('/olive-run.png?v=7') 0 0 / 11616px 240px; will-change: transform; }

/* arriving via Home: land settled & steady — no intro replay */
.instant .video-frame { animation: none !important; transform: scale(0); opacity: 0; }
.instant .video-blob { animation: none !important; opacity: 0; }
.instant .particle { animation: none !important; opacity: 0; }
.instant .hero-actions.show .btn { animation: none !important; }

/* ---------- RESPONSIVE ---------- */
@media (max-width: 820px) {
  .hero-inner { grid-template-columns: 1fr; text-align: center; }
  .hero-left { order: 2; }
  .hero-right { order: 1; }
  .hero-subtitle, .hero-tagline { max-width: none; }
  .hero-actions { justify-content: center; }
  .video-frame { transform: rotate(0); margin: 0 auto; box-shadow: 6px 8px 0 var(--brown); }
  .olive-viewport { transform: scale(0.42); transform-origin: left bottom; }
}
`;
