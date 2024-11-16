export function initializeGame(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("2D context is not available on this canvas.");
    return;
  }

  // Adjust canvas size for responsiveness
  const resizeCanvas = () => {
    canvas.width = window.innerWidth * 0.9; // 90% of viewport width
    canvas.height = window.innerHeight * 0.8; // 80% of viewport height
  };
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 20,
    color: "white",
  };

  let enemies: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    velocityX: number;
    velocityY: number;
    motionPattern: number;
    angle: number;
  }[] = [];
  const projectiles: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[] = [];
  const keys: Record<string, boolean> = {};
  let score = 0;
  let level = 1;
  let levelTransition = false;

  function spawnEnemies() {
    const maxEnemiesPerRow = Math.floor(canvas.width / 60); // Adjust for spacing
    const rows = Math.min(3 + level, 6); // Cap rows to 6
    const enemySpeed = 1 + level * 0.5;

    enemies = Array.from({ length: rows * maxEnemiesPerRow }, (_, i) => {
      const pattern = Math.random(); // Random motion pattern
      const entrySide = Math.random(); // Random entry side

      let x, y;
      if (entrySide < 0.33) {
        // Enter from top
        x = (i % maxEnemiesPerRow) * 60 + 10;
        y = -50; // Start above the canvas
      } else if (entrySide < 0.66) {
        // Enter from left
        x = -40; // Start slightly beyond the left edge
        y = Math.random() * (canvas.height / 2); // Random vertical position
      } else {
        // Enter from right
        x = canvas.width + 40; // Start slightly beyond the right edge
        y = Math.random() * (canvas.height / 2); // Random vertical position
      }

      return {
        x,
        y,
        width: 40,
        height: 20,
        color: "red",
        velocityX: entrySide < 0.5 ? enemySpeed : -enemySpeed, // Move left or right
        velocityY: 2, // Encourage motion into the screen vertically
        motionPattern: pattern, // Save pattern for circular or diving motions
        angle: 0, // For circular motion
      };
    });
  }

  function resetPlayer() {
    player.x = canvas.width / 2 - player.width / 2;
  }

  function drawPlayer() {
    ctx!.fillStyle = player.color;
    ctx!.fillRect(player.x, player.y, player.width, player.height);
  }

  function drawEnemies() {
    enemies.forEach((enemy) => {
      ctx!.fillStyle =
        enemy.motionPattern < 0.6 && enemy.velocityY !== 0 ? "orange" : "red"; // Diving enemies are orange
      ctx!.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
  }

  function drawProjectiles() {
    projectiles.forEach((projectile) => {
      ctx!.fillStyle = projectile.color;
      ctx!.fillRect(
        projectile.x,
        projectile.y,
        projectile.width,
        projectile.height
      );
    });
  }

  function moveEnemies() {
    enemies.forEach((enemy) => {
      if (enemy.motionPattern < 0.3) {
        // Circular motion
        enemy.x += Math.cos(enemy.angle) * enemy.velocityX;
        enemy.y += Math.sin(enemy.angle) * enemy.velocityY;
        enemy.angle += 0.05; // Adjust speed of circular motion
      } else if (enemy.motionPattern < 0.6) {
        // Diving motion
        if (Math.random() < 0.01) {
          const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
          const dy =
            player.y + player.height / 2 - (enemy.y + enemy.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          enemy.velocityX = (dx / distance) * 5;
          enemy.velocityY = (dy / distance) * 5;
        }
      } else {
        // Linear or diagonal motion
        enemy.x += enemy.velocityX;
        enemy.y += enemy.velocityY;

        // Reverse direction if enemy hits edges
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
          enemy.velocityX *= -1;
        }
        if (enemy.y <= 0 || enemy.y + enemy.height >= canvas.height / 2) {
          enemy.velocityY *= -1;
        }
      }

      // Ensure enemies enter the screen fully
      if (enemy.x < 0) enemy.x += 2; // Push into screen
      if (enemy.x > canvas.width - enemy.width) enemy.x -= 2; // Push into screen
      if (enemy.y < 0) enemy.y += 2; // Push into screen
      if (enemy.y > canvas.height - enemy.height) enemy.y -= 2; // Push into screen
    });
  }

  function moveProjectiles() {
    projectiles.forEach((projectile, index) => {
      projectile.y -= 5;

      if (projectile.y + projectile.height < 0) {
        projectiles.splice(index, 1);
      }
    });
  }

  function checkCollisions() {
    projectiles.forEach((projectile, pIndex) => {
      enemies.forEach((enemy, eIndex) => {
        if (
          projectile.x < enemy.x + enemy.width &&
          projectile.x + projectile.width > enemy.x &&
          projectile.y < enemy.y + enemy.height &&
          projectile.y + projectile.height > enemy.y
        ) {
          projectiles.splice(pIndex, 1);
          enemies.splice(eIndex, 1);
          score += 10;
        }
      });
    });
  }

  function levelUp() {
    if (enemies.length === 0 && !levelTransition) {
      levelTransition = true;
      level++;
      updateScoreAndLevel();

      const levelUpMessage = document.querySelector("#level-up");
      if (levelUpMessage) {
        levelUpMessage.textContent = `Level ${level}!`;
        levelUpMessage.classList.remove("hidden");
      }

      setTimeout(() => {
        if (levelUpMessage) levelUpMessage.classList.add("hidden");
        resetPlayer();
        levelTransition = false;
        projectiles.length = 0;
        spawnEnemies();
      }, 2000);
    }
  }

  function updateScoreAndLevel() {
    const scoreElement = document.querySelector("#score");
    const levelElement = document.querySelector("#level");
    if (scoreElement) scoreElement.textContent = `Score: ${score}`;
    if (levelElement) levelElement.textContent = `Level: ${level}`;
  }

  function update() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawEnemies();
    drawProjectiles();

    if (!levelTransition) {
      moveEnemies();
      moveProjectiles();
      checkCollisions();
    }

    updateScoreAndLevel();
    levelUp();

    if (keys["ArrowLeft"] && player.x > 0) {
      player.x -= 5;
    }
    if (keys["ArrowRight"] && player.x + player.width < canvas.width) {
      player.x += 5;
    }

    requestAnimationFrame(update);
  }

  function handleKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;

    if (e.key === " " && !levelTransition) {
      projectiles.push({
        x: player.x + player.width / 2 - 5,
        y: player.y,
        width: 5,
        height: 10,
        color: "yellow",
      });
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  spawnEnemies();
  update();
}
