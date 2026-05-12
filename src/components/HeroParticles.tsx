import { useEffect, useRef } from "react";

export function HeroParticles({ isAnalyzing = false }: { isAnalyzing?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let animationFrameId: number;
    let mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 120,
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        mouse.x = null;
        mouse.y = null;
      } else {
        mouse.x = x;
        mouse.y = y;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      randomOffset: number;
      speedY: number;
      speedX: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.density = Math.random() * 30 + 1;
        this.randomOffset = Math.random() * Math.PI * 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update(time: number, isAnalyzingActive: boolean) {
        if (isAnalyzingActive && canvas) {
          // Gathering and scattering animation
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Smoother, more elegant pulsing: 0 to 1
          const pulse = (Math.sin(time / 800 - this.randomOffset * 0.5) + 1) / 2; 
          
          // The particles should pull tightly to the center, then scatter back fully
          // pulse = 1 means pull to center. pulse = 0 means pull to base.
          // Add a slight rotation or swirl as they gather
          const swirlRadius = pulse * 100 * (this.speedX);
          const targetX = this.baseX + (centerX - this.baseX) * Math.pow(pulse, 2) + Math.cos(time / 300 + this.randomOffset) * swirlRadius;
          const targetY = this.baseY + (centerY - this.baseY) * Math.pow(pulse, 2) + Math.sin(time / 300 + this.randomOffset) * swirlRadius;
          
          // Move smoothly towards target
          // Using a faster interpolation when pulling in (pulse is high), slower when scattering
          const ease = 0.02 + Math.pow(pulse, 2) * 0.08;
          this.x += (targetX - this.x) * ease;
          this.y += (targetY - this.y) * ease;

        } else if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = mouse.radius;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;

          if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
          } else {
            let targetX = this.baseX + Math.cos(time / 2000 + this.randomOffset) * 10;
            let targetY = this.baseY + Math.sin(time / 2000 + this.randomOffset) * 10;
            this.x += (targetX - this.x) * 0.02;
            this.y += (targetY - this.y) * 0.02;
          }
        } else {
            let targetX = this.baseX + Math.cos(time / 2000 + this.randomOffset) * 10;
            let targetY = this.baseY + Math.sin(time / 2000 + this.randomOffset) * 10;
            this.x += (targetX - this.x) * 0.02;
            this.y += (targetY - this.y) * 0.02;
        }
      }
    }

    function init() {
      particlesArray = [];
      if (!canvas) return;
      const numberOfParticles = (canvas.width * canvas.height) / 6000; // slightly denser
      for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
      }
    }

    function animate(currentTime: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
        particlesArray[i].update(currentTime, isAnalyzing);
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    handleResize(); // trigger initial sizing
    animate(0);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnalyzing]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}
