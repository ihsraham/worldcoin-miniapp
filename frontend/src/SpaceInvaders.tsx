import { useEffect, useRef, useState } from "react";
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
  const handleRestart = () => {
    setScore(0);
    setLevel(1);
    setIsBossLevel(false);
    setGameState("playing");
  };

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
      lastShot: 0,
      fireRate: 250, // 250ms between shots
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

    // Initialize game assets
    const playerPath = new Path2D("M25,0 L50,50 L0,50 Z");
    const enemyPath = new Path2D("M0,0 H40 L20,20 Z");
    const bossPath = new Path2D(`
      M40,0 L80,40 L60,80 L20,80 L0,40 L40,0
      M20,20 L60,20 L60,60 L20,60 L20,20
    `);

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

    // Boss creation with improved health scaling
    const createBoss = () => {
      setIsBossLevel(true);
      const bossLevel = Math.floor(level / 5);
      const bossHealth = 100 + (bossLevel - 1) * 50; // Health increases each boss level
      boss = {
        x: canvas.width / 2 - 40,
        y: 50,
        width: 80,
        height: 80,
        health: bossHealth,
        maxHealth: bossHealth,
        pattern: 0,
        lastShot: 0,
        phase: 0,
        shootingPattern: 0,
      };
    };

    // Enemy spawning with patterns
    const spawnEnemies = () => {
      const rows = Math.min(2 + Math.floor(level / 2), 5);
      const cols = Math.min(4 + Math.floor(level / 3), 8);
      const spacing = (canvas.width - 100) / (cols - 1);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          enemies.push({
            x: 50 + j * spacing,
            y: 50 + i * 60,
            width: 40,
            height: 40,
            pattern: Math.floor(Math.random() * 3),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    // Simple shooting mechanism with rate limit
    const shoot = () => {
      const now = Date.now();
      if (now - player.lastShot >= player.fireRate) {
        projectiles.push({
          x: player.x + player.width / 2,
          y: player.y,
          radius: 4,
          velocity: { x: 0, y: -7 },
        });
        player.lastShot = now;
      }
    };
    // Controls
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
      shoot();
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    };

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
        case " ":
          shoot();
          break;
        case "p":
          setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
          break;
      }
    };

    // Calculate level progress
    const calculateProgress = () => {
      if (isBossLevel) {
        return boss
          ? Math.max(0, 100 - (boss.health / boss.maxHealth) * 100)
          : 100;
      } else {
        const initialEnemyCount =
          Math.min(2 + Math.floor(level / 2), 5) *
          Math.min(4 + Math.floor(level / 3), 8);
        return Math.floor(
          ((initialEnemyCount - enemies.length) / initialEnemyCount) * 100
        );
      }
    };

    // Main game loop
    const render = () => {
      if (gameState === "over") {
        // Save high score
        if (score > highScore) {
          localStorage.setItem("spaceInvadersHighScore", score.toString());
          setHighScore(score);
        }
        return;
      }

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
        projectile.x += projectile.velocity?.x || 0;
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
            enemy.x = Math.max(
              0,
              Math.min(canvas.width - enemy.width, enemy.x)
            );
            enemy.phase += 0.05;
            break;

          case 1: // Circle
            const nextX = enemy.x + Math.cos(enemy.phase) * 2;
            const nextY = enemy.y + Math.sin(enemy.phase) * 2;

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
              if (nextY <= canvas.height - enemy.height) {
                enemy.y = nextY;
              }
            }
            break;
        }

        // Check if enemy hits player or reaches bottom
        if (
          (enemy.y + enemy.height >= player.y &&
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x) ||
          enemy.y + enemy.height >= canvas.height
        ) {
          createParticles(
            player.x + player.width / 2,
            player.y + player.height / 2,
            "#00ff00"
          );
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          setGameState("over");
        }

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = "#ff0000";
        ctx.fill(enemyPath);
        ctx.restore();

        // Collision detection with player projectiles
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

            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
          }
        });
      });
      // Boss logic
      if (boss) {
        // Boss movement pattern
        boss.phase += 0.02;
        boss.x = canvas.width / 2 + Math.cos(boss.phase) * (canvas.width / 3);

        // Boss shooting patterns
        if (Date.now() - boss.lastShot > 1000) {
          boss.shootingPattern = (boss.shootingPattern + 1) % 2;

          if (boss.shootingPattern === 0) {
            // Pattern 1: Aimed shots at player with spread
            const angleToPlayer = Math.atan2(
              player.y - boss.y,
              player.x - boss.x
            );
            for (let i = -2; i <= 2; i++) {
              bossProjectiles.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                velocity: {
                  x: Math.cos(angleToPlayer + i * 0.2) * 5,
                  y: Math.sin(angleToPlayer + i * 0.2) * 5,
                },
                radius: 6,
              });
            }
          } else {
            // Pattern 2: Circular pattern
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              bossProjectiles.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                velocity: {
                  x: Math.cos(angle) * 4,
                  y: Math.sin(angle) * 4,
                },
                radius: 4,
              });
            }
          }

          boss.lastShot = Date.now();
        }

        // Update and draw boss projectiles
        bossProjectiles.forEach((projectile, index) => {
          projectile.x += projectile.velocity.x;
          projectile.y += projectile.velocity.y;

          if (
            projectile.x < 0 ||
            projectile.x > canvas.width ||
            projectile.y < 0 ||
            projectile.y > canvas.height
          ) {
            bossProjectiles.splice(index, 1);
            return;
          }

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
            createParticles(
              player.x + player.width / 2,
              player.y + player.height / 2,
              "#00ff00"
            );
            bossProjectiles.splice(index, 1);

            if (navigator.vibrate) {
              navigator.vibrate(200);
            }

            setGameState("over");
          }
        });

        // Draw boss
        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.fillStyle = "#ff0000";
        ctx.fill(bossPath);
        ctx.restore();

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
              createParticles(
                boss.x + boss.width / 2,
                boss.y + boss.height / 2,
                "#ff0000"
              );
              createParticles(boss.x, boss.y, "#ff0000");
              createParticles(boss.x + boss.width, boss.y, "#ff0000");
              boss = null;
              setIsBossLevel(false);
              setScore((prev) => prev + 1000);

              if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
              }
            }
          }
        });

        // Draw boss health bar
        const healthBarWidth = 200;
        const healthBarHeight = 10;
        const healthPercentage = boss.health / boss.maxHealth;

        // Health bar background
        ctx.fillStyle = "#330000";
        ctx.fillRect(
          (canvas.width - healthBarWidth) / 2,
          10,
          healthBarWidth,
          healthBarHeight
        );

        // Health bar fill
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(
          (canvas.width - healthBarWidth) / 2,
          10,
          healthBarWidth * healthPercentage,
          healthBarHeight
        );
      }

      // Level progress and completion
      setLevelProgress(calculateProgress());

      // Level completion check
      if ((isBossLevel && !boss) || (!isBossLevel && enemies.length === 0)) {
        setLevel((prev) => prev + 1);
        setIsLevelUp(true);

        // Check if next level should be a boss level
        const nextLevel = level + 1;
        const shouldBeBossLevel = nextLevel % 5 === 0;
        setIsBossLevel(shouldBeBossLevel);

        if (shouldBeBossLevel) {
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
        isGameOver={gameState === "over"}
        onRestart={handleRestart}
        finalScore={score}
        highScore={highScore}
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
