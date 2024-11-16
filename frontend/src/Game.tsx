export function initializeGame(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("2D context is not available on this canvas.");
    return;
  }

  const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 20,
    color: "white",
  };

  const enemies = Array.from({ length: 10 }, (_, i) => ({
    x: i * 70 + 20,
    y: 50,
    width: 40,
    height: 20,
    color: "red",
    velocityX: 2,
  }));

  const projectiles: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[] = [];
  const keys: Record<string, boolean> = {};
  let score = 0;

  function drawPlayer() {
    ctx!.fillStyle = player.color;
    ctx!.fillRect(player.x, player.y, player.width, player.height);
  }

  function drawEnemies() {
    enemies.forEach((enemy) => {
      ctx!.fillStyle = enemy.color;
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
      enemy.x += enemy.velocityX;

      // Reverse direction if enemy hits the edges
      if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
        enemy.velocityX *= -1;
      }
    });
  }

  function moveProjectiles() {
    projectiles.forEach((projectile, index) => {
      projectile.y -= 5;

      // Remove projectile if it goes off-screen
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
          // Collision detected: remove both the projectile and the enemy
          projectiles.splice(pIndex, 1);
          enemies.splice(eIndex, 1);
          score += 10;
        }
      });
    });
  }

  function updateScore() {
    const scoreElement = document.querySelector("#score");
    if (scoreElement) scoreElement.textContent = `Score: ${score}`;
  }

  function update() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    // Draw and move entities
    drawPlayer();
    drawEnemies();
    drawProjectiles();
    moveEnemies();
    moveProjectiles();
    checkCollisions();
    updateScore();

    // Handle player movement
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

    // Fire projectile
    if (e.key === " ") {
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

  // Event listeners
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // Start game loop
  update();
}
