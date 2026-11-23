/** Canvas effect ported from themes/yun/source/js/ui/fireworks.js (MIT, YunYouJun). */
export function initFireworks(canvas: HTMLCanvasElement, colors: string[]) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const palette = colors.length ? colors : ['102, 167, 221', '62, 131, 225', '33, 78, 194'];
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const easeOutExpo = (progress: number) => progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
  type Burst = {
    start: number; x: number; y: number; duration: number;
    ringRadius: number; ringDuration: number; fadeDuration: number;
    particles: { dx: number; dy: number; radius: number; color: string }[];
  };
  let bursts: Burst[] = [];
  let frame = 0;
  let width = innerWidth;
  let height = innerHeight;
  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    const scale = devicePixelRatio || 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  };
  const draw = (now: number) => {
    // This callback is no longer pending; a drawing error must not block future clicks.
    frame = 0;
    ctx.clearRect(0, 0, width, height);
    bursts = bursts.filter((burst) => now - burst.start < Math.max(burst.duration, burst.ringDuration));
    for (const burst of bursts) {
      // RAF timestamps can precede a pointer event processed in the same frame.
      const elapsed = Math.max(0, now - burst.start);
      if (elapsed < burst.duration) {
        const progress = easeOutExpo(elapsed / burst.duration);
        for (const particle of burst.particles) {
          ctx.beginPath();
          ctx.arc(burst.x + particle.dx * progress, burst.y + particle.dy * progress,
            particle.radius + (0.1 - particle.radius) * progress, 0, Math.PI * 2, true);
          ctx.fillStyle = particle.color;
          ctx.fill();
        }
      }
      if (elapsed < burst.ringDuration) {
        const progress = easeOutExpo(elapsed / burst.ringDuration);
        ctx.globalAlpha = Math.max(0, 0.5 * (1 - elapsed / burst.fadeDuration));
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, 0.1 + (burst.ringRadius - 0.1) * progress, 0, Math.PI * 2, true);
        ctx.lineWidth = Math.max(0.001, 6 * (1 - progress));
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    frame = bursts.length ? requestAnimationFrame(draw) : 0;
  };
  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    bursts.push({
      start: performance.now(), x: event.clientX, y: event.clientY,
      duration: random(900, 1500), ringRadius: random(50, 100),
      ringDuration: random(1200, 1800), fadeDuration: random(600, 800),
      particles: Array.from({ length: 20 }, () => {
        const angle = random(0, 360) * Math.PI / 180;
        const distance = random(50, 100) * (random(0, 1) ? 1 : -1);
        return { dx: distance * Math.cos(angle), dy: distance * Math.sin(angle),
          radius: random(10, 20), color: `rgba(${palette[random(0, palette.length - 1)]}, ${0.2 + Math.random() * 0.6})` };
      }),
    });
    if (!frame) frame = requestAnimationFrame(draw);
  });
  resize();
  window.addEventListener('resize', resize);
}
