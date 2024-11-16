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

  let enemies: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    velocityX: number;
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

    enemies = Array.from({ length: rows * maxEnemiesPerRow }, (_, i) => ({
      x: (i % maxEnemiesPerRow) * 60 + 10, // Adjust for spacing
      y: Math.floor(i / maxEnemiesPerRow) * 50 + 50,
      width: 40,
      height: 20,
      color: "red",
      velocityX: enemySpeed,
    }));
  }

  function resetPlayer() {
    player.x = canvas.width / 2 - 25;
  }

  function levelUp() {
    if (enemies.length === 0 && !levelTransition) {
      levelTransition = true; // Prevent multiple calls
      level++; // Increment the level once
      updateScoreAndLevel();

      const levelUpMessage = document.querySelector("#level-up");
      if (levelUpMessage) {
        levelUpMessage.textContent = `Level ${level}!`;
        levelUpMessage.classList.remove("hidden");
      }

      setTimeout(() => {
        if (levelUpMessage) levelUpMessage.classList.add("hidden");
        resetPlayer();
        levelTransition = false; // Allow new transitions after this one
        projectiles.length = 0; // Clear projectiles
        spawnEnemies(); // Spawn new enemies
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

      if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
        enemy.velocityX *= -1;
      }
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
