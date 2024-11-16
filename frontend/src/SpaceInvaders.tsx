// SpaceInvaders.tsx
import React, { useEffect, useRef, useState } from "react";
import { ScoreDisplay } from "./components/game/ScoreDisplay";
import { LevelProgress } from "./components/game/LevelProgress";
import { GameOverlay } from "./components/game/GameOverlay";

interface BossProjectile {
  x: number;
  y: number;
  velocity: {
    x: number;
    y: number;
  };
  radius: number;
}

const SpaceInvaders = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "paused" | "over">(
    "playing"
  );
  const [levelProgress, setLevelProgress] = useState(0);
  const [isBossLevel, setIsBossLevel] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Game state
    let animationFrameId: number;
    let player = {
      x: canvas.width / 2,
      y: canvas.height - 60,
      width: 50,
      height: 50,
      speed: 5,
    };

    let projectiles: any[] = [];
    let enemies: any[] = [];
    let boss: any = null;
    let particles: any[] = [];
    let touchStartX = 0;
    let bossProjectiles: BossProjectile[] = [];

    // Load stored high score
    const storedHighScore = localStorage.getItem("spaceInvadersHighScore");
    if (storedHighScore) setHighScore(parseInt(storedHighScore));

    // Initialize game assets (implemented as SVG paths for better graphics)
    const playerPath = new Path2D("M25,0 L50,50 L0,50 Z");
    const enemyPath = new Path2D("M0,0 H40 L20,20 Z");
    const bossPath = new Path2D("M0,0 H80 L40,40 Z");

    // Particle effect system
    const createParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 8; i++) {
        particles.push({
          x,
          y,
          radius: Math.random() * 3,
          color,
          velocity: {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
          },
          alpha: 1,
        });
      }
    };

    // Boss creation
    const createBoss = () => {
      setIsBossLevel(true);
      boss = {
        x: canvas.width / 2 - 40,
        y: 50,
        width: 80,
        height: 80,
        health: 100,
        pattern: 0,
        lastShot: 0,
      };
    };

    // Enemy spawning with patterns
    const spawnEnemies = () => {
      const rows = Math.min(2 + Math.floor(level / 2), 5);
      const cols = Math.min(4 + Math.floor(level / 3), 8);

      // Calculate spacing to fit all enemies on screen
      const spacing = (canvas.width - 100) / (cols - 1); // 100px margin total

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          enemies.push({
            x: 50 + j * spacing, // Start 50px from left edge
            y: 50 + i * 60,
            width: 40,
            height: 40,
            pattern: Math.floor(Math.random() * 3),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - touchStartX;

      if (Math.abs(deltaX) > 10) {
        player.x += deltaX > 0 ? player.speed : -player.speed;
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        touchStartX = touchX;
      }
    };

    const handleTouchEnd = () => {
      // Shoot on touch release
      projectiles.push({
        x: player.x + player.width / 2,
        y: player.y,
        radius: 4,
      });

      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    };

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      switch (e.key) {
        case "ArrowLeft":
          player.x -= player.speed;
          if (player.x < 0) player.x = 0;
          break;
        case "ArrowRight":
          player.x += player.speed;
          if (player.x + player.width > canvas.width)
            player.x = canvas.width - player.width;
          break;
        case " ": // Spacebar
          projectiles.push({
            x: player.x + player.width / 2,
            y: player.y,
            radius: 4,
          });
          break;
        case "p": // Add pause functionality
          setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
          break;
      }
    };

    // Main game loop
    const render = () => {
      if (gameState !== "playing") return;

      ctx.fillStyle = "#000033";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starfield background
      particles.forEach((particle, index) => {
        particle.alpha -= 0.01;
        if (particle.alpha <= 0) {
          particles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
      });

      // Draw player
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.fillStyle = "#00ff00";
      ctx.fill(playerPath);
      ctx.restore();

      // Update and draw projectiles
      projectiles.forEach((projectile, index) => {
        projectile.y -= 7;

        if (projectile.y < 0) {
          projectiles.splice(index, 1);
          return;
        }

        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw enemies
      enemies.forEach((enemy, index) => {
        // Enemy movement patterns with boundary checks
        switch (enemy.pattern) {
          case 0: // Sine wave
            enemy.x += Math.sin(enemy.phase) * 2;
            // Constrain horizontal movement
            enemy.x = Math.max(
              0,
              Math.min(canvas.width - enemy.width, enemy.x)
            );
            enemy.phase += 0.05;
            break;

          case 1: // Circle
            const nextX = enemy.x + Math.cos(enemy.phase) * 2;
            const nextY = enemy.y + Math.sin(enemy.phase) * 2;

            // Only update position if within bounds
            if (nextX >= 0 && nextX <= canvas.width - enemy.width) {
              enemy.x = nextX;
            }
            if (nextY >= 0 && nextY <= canvas.height / 2) {
              enemy.y = nextY;
            }
            enemy.phase += 0.03;
            break;

          case 2: // Dive
            if (Math.random() < 0.01) {
              const nextY = enemy.y + 5;
              // Only dive if within vertical bounds
              if (nextY <= canvas.height - enemy.height) {
                enemy.y = nextY;
              }
            }
            break;
        }

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = "#ff0000";
        ctx.fill(enemyPath);
        ctx.restore();

        // Collision detection with projectiles
        projectiles.forEach((projectile, pIndex) => {
          if (
            projectile.x > enemy.x &&
            projectile.x < enemy.x + enemy.width &&
            projectile.y > enemy.y &&
            projectile.y < enemy.y + enemy.height
          ) {
            createParticles(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              "#ff0000"
            );
            enemies.splice(index, 1);
            projectiles.splice(pIndex, 1);
            setScore((prev) => prev + 100);

            // Haptic feedback for hit
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
          }
        });
      });

      // Boss logic
      if (boss) {
        boss.x += Math.cos(Date.now() / 1000) * 3;

        if (Date.now() - boss.lastShot > 1000) {
          // Boss shooting pattern
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

          for (let i = -1; i <= 1; i++) {
            bossProjectiles.push({
              x: boss.x + boss.width / 2,
              y: boss.y + boss.height,
              velocity: {
                x: Math.cos(angle + i * 0.2) * 5,
                y: Math.sin(angle + i * 0.2) * 5,
              },
              radius: 6,
            });
          }

          boss.lastShot = Date.now();
        }

        // Update and draw boss projectiles
        bossProjectiles.forEach((projectile, index) => {
          projectile.x += projectile.velocity.x;
          projectile.y += projectile.velocity.y;

          // Remove projectiles that are off screen
          if (
            projectile.x < 0 ||
            projectile.x > canvas.width ||
            projectile.y < 0 ||
            projectile.y > canvas.height
          ) {
            bossProjectiles.splice(index, 1);
            return;
          }

          // Draw boss projectiles
          ctx.fillStyle = "#ff4444";
          ctx.beginPath();
          ctx.arc(
            projectile.x,
            projectile.y,
            projectile.radius,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Collision with player
          if (
            projectile.x > player.x &&
            projectile.x < player.x + player.width &&
            projectile.y > player.y &&
            projectile.y < player.y + player.height
          ) {
            // Player hit by boss projectile
            createParticles(
              player.x + player.width / 2,
              player.y + player.height / 2,
              "#00ff00"
            );
            bossProjectiles.splice(index, 1);

            // Trigger haptic feedback for hit
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }

            // You might want to implement player health/lives system here
            // For now, let's just end the game
            setGameState("over");
          }
        });

        // Boss collision with player projectiles
        projectiles.forEach((projectile, pIndex) => {
          if (
            projectile.x > boss.x &&
            projectile.x < boss.x + boss.width &&
            projectile.y > boss.y &&
            projectile.y < boss.y + boss.height
          ) {
            createParticles(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              "#ff0000"
            );
            projectiles.splice(pIndex, 1);
            boss.health -= 10;

            if (boss.health <= 0) {
              boss = null;
              setIsBossLevel(false);
              setScore((prev) => prev + 1000); // Bonus points for defeating boss

              // Trigger intense haptic feedback for boss defeat
              if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
              }
            }
          }
        });

        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.fillStyle = "#ff0000";
        ctx.fill(bossPath);
        ctx.restore();

        // Draw boss health bar
        ctx.fillStyle = "#330000";
        ctx.fillRect(10, 10, 200, 10);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(10, 10, (boss.health / 100) * 200, 10);
      }

      // Level progress
      const progress =
        enemies.length === 0 && !boss
          ? 100
          : Math.floor(
              ((level % 5 === 0 ? boss?.health : enemies.length) /
                (level % 5 === 0 ? 100 : enemies.length)) *
                100
            );
      setLevelProgress(100 - progress);

      // Level completion check
      if (enemies.length === 0 && !boss) {
        setLevel((prev) => prev + 1);
        setIsLevelUp(true);

        if (level % 5 === 0) {
          createBoss();
        } else {
          spawnEnemies();
        }

        setTimeout(() => setIsLevelUp(false), 2000);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Event listeners
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    // Initial spawn
    spawnEnemies();
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [level, gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black to-blue-900 p-4">
      <ScoreDisplay score={score} highScore={highScore} level={level} />

      <div className="relative mt-4">
        <canvas
          ref={canvasRef}
          width={350}
          height={600}
          className="border-4 border-blue-500 rounded-lg shadow-lg shadow-blue-500/50"
        />

        <div className="mt-4">
          <LevelProgress progress={levelProgress} isBossLevel={isBossLevel} />
        </div>
      </div>

      <GameOverlay
        isLevelUp={isLevelUp}
        isBossLevel={isBossLevel}
        level={level}
        onResume={() => setGameState("playing")}
        isPaused={gameState === "paused"}
      />

      <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 p-2 rounded-lg backdrop-blur-sm">
        <p>Controls:</p>
        <p>← → : Move</p>
        <p>Space: Shoot</p>
        <p>P: Pause</p>
      </div>
    </div>
  );
};

export default SpaceInvaders;
