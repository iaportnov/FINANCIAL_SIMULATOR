import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  type: "ring" | "stripe" | "dot";
  opacity: number;
  angle: number;
  rotationSpeed: number;
  driftX: number;
  driftY: number;
}

export function AntigravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Track mouse coordinates
    const mouse = {
      x: -1000,
      y: -1000,
      isActive: false,
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };

    const handlePointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isActive = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerdown", handlePointerMove); // support touch start

    // ВТБ Color Palette: blues, azures, golds, and custom theme colors
    const colors = [
      "rgba(31, 84, 230, 0.4)",   // --vtb-blue (#1f54e6)
      "rgba(3, 166, 232, 0.5)",   // --vtb-azure (#03a6e8)
      "rgba(74, 196, 255, 0.6)",  // --vtb-sky (#4ac4ff)
      "rgba(255, 181, 71, 0.45)", // --vtb-gold (#ffb547)
      "rgba(10, 45, 128, 0.3)",   // --vtb-navy (#0a2d80)
    ];

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 80;

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const typeRand = Math.random();
      let type: "ring" | "stripe" | "dot" = "dot";
      let baseSize = Math.random() * 2 + 1; // dots: 1-3px

      if (typeRand > 0.75) {
        type = "ring";
        baseSize = Math.random() * 10 + 6; // rings: 6-16px
      } else if (typeRand > 0.5) {
        type = "stripe";
        baseSize = Math.random() * 8 + 6; // stripes: 6-14px
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: baseSize,
        baseSize,
        color: colors[Math.floor(Math.random() * colors.length)],
        type,
        opacity: Math.random() * 0.4 + 0.15,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: -(Math.random() * 0.25 + 0.1), // float upwards
      });
    }

    const INFLUENCE_RADIUS = 180;
    const REPULSION_FORCE = 0.65;
    const MAX_VELOCITY = 5;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw dynamic background glow around the cursor (spotlight effect)
      if (mouse.isActive) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          260
        );
        glowGrad.addColorStop(0, "rgba(74, 196, 255, 0.06)");
        glowGrad.addColorStop(0.5, "rgba(31, 84, 230, 0.015)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw lines between nearby particles
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 110;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist / maxDist) * 0.06 * (p1.opacity + p2.opacity);
            ctx.strokeStyle = `rgba(3, 166, 232, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Update and draw particles
      particles.forEach((p) => {
        let scale = 1;
        let opacity = p.opacity;

        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist < INFLUENCE_RADIUS) {
            const force = (INFLUENCE_RADIUS - dist) / INFLUENCE_RADIUS;
            const push = force * REPULSION_FORCE;
            const angle = dist > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            
            p.vx += Math.cos(angle) * push;
            p.vy += Math.sin(angle) * push;

            scale = 1 + force * 0.55;
            opacity = Math.min(p.opacity + force * 0.45, 0.9);
          }
        }

        // Apply drag/friction
        p.vx *= 0.94;
        p.vy *= 0.94;

        // Limit velocity
        const speedSq = p.vx * p.vx + p.vy * p.vy;
        if (speedSq > MAX_VELOCITY * MAX_VELOCITY) {
          const speed = Math.sqrt(speedSq);
          p.vx = (p.vx / speed) * MAX_VELOCITY;
          p.vy = (p.vy / speed) * MAX_VELOCITY;
        }

        // Move by velocity + drift
        p.x += p.vx + p.driftX;
        p.y += p.vy + p.driftY;

        // Apply rotation
        p.angle += p.rotationSpeed;

        // Boundaries check with margins
        const margin = 35;
        if (p.y < -margin) {
          p.y = height + margin;
          p.x = Math.random() * width;
          p.vx = 0;
          p.vy = 0;
        } else if (p.y > height + margin) {
          p.y = -margin;
          p.x = Math.random() * width;
          p.vx = 0;
          p.vy = 0;
        }
        if (p.x < -margin) {
          p.x = width + margin;
          p.vx = 0;
          p.vy = 0;
        } else if (p.x > width + margin) {
          p.x = -margin;
          p.vx = 0;
          p.vy = 0;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;

        const renderSize = p.baseSize * scale;

        if (p.type === "ring") {
          ctx.beginPath();
          ctx.arc(0, 0, renderSize, 0, Math.PI * 2);
          ctx.lineWidth = 1.25;
          ctx.stroke();
        } else if (p.type === "stripe") {
          // Parallelogram matching VTB brand wings
          const w = renderSize * 1.5;
          const h = renderSize * 0.42;
          const slant = h * 0.75;

          ctx.beginPath();
          ctx.moveTo(-w / 2 + slant, -h / 2);
          ctx.lineTo(w / 2 + slant, -h / 2);
          ctx.lineTo(w / 2 - slant, h / 2);
          ctx.lineTo(-w / 2 - slant, h / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Small glowing dots
          ctx.beginPath();
          ctx.arc(0, 0, renderSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerdown", handlePointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}
