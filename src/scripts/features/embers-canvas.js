/**
 * Brasas y ceniza del hero, dibujadas en canvas 2D.
 * Respeta `prefers-reduced-motion`: en ese caso dibuja un único fotograma.
 */
import { onReducedMotionChange, prefersReducedMotion } from '../core/motion.js';

const PARTICLE_COUNT = 70;
const EMBER_RATIO = 0.65;
const DRIFT_SPEED = 0.02;
const SIDEWAYS_SPEED = 0.5;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function mountEmbersCanvas(canvas) {
  const context = canvas?.getContext?.('2d');

  if (!context) {
    return null;
  }

  let particles = [];
  let width = 0;
  let height = 0;
  let frameId = null;

  function createParticle(startInsideView) {
    const isEmber = Math.random() < EMBER_RATIO;

    return {
      isEmber,
      x: Math.random() * width,
      y: startInsideView
        ? Math.random() * height
        : isEmber
          ? height + 10
          : -10,
      size: randomBetween(0.6, 2.8),
      speed: randomBetween(0.3, 1.1),
      drift: randomBetween(0, Math.PI * 2),
    };
  }

  function seed() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(true));
  }

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    seed();
  }

  function paint(particle) {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = particle.isEmber
      ? `rgba(255, ${120 + Math.floor(particle.size * 30)}, 50, .8)`
      : 'rgba(154, 149, 142, .35)';
    context.shadowBlur = particle.isEmber ? 10 : 0;
    context.shadowColor = '#ff6a2a';
    context.fill();
  }

  function update(particle) {
    particle.drift += DRIFT_SPEED;
    particle.x += Math.sin(particle.drift) * SIDEWAYS_SPEED;
    particle.y += particle.isEmber ? -particle.speed : particle.speed * 0.6;

    const outOfView = particle.y < -12 || particle.y > height + 12;

    return outOfView ? createParticle(false) : particle;
  }

  function renderFrame() {
    context.clearRect(0, 0, width, height);
    particles = particles.map(update);
    particles.forEach(paint);
  }

  function loop() {
    renderFrame();
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    if (frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(loop);
  }

  function stop() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function syncWithMotionPreference() {
    stop();

    if (prefersReducedMotion()) {
      renderFrame();
      return;
    }

    start();
  }

  function handleResize() {
    if (canvas.offsetWidth === width && canvas.offsetHeight === height) {
      return;
    }

    resize();

    if (prefersReducedMotion()) {
      renderFrame();
    }
  }

  resize();
  syncWithMotionPreference();

  const resizeObserver =
    'ResizeObserver' in window
      ? new ResizeObserver(handleResize)
      : null;

  if (resizeObserver) {
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener('resize', handleResize);
  }

  const stopListeningToMotion = onReducedMotionChange(syncWithMotionPreference);

  return {
    start,
    stop,
    destroy() {
      stop();
      stopListeningToMotion();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
    },
  };
}
