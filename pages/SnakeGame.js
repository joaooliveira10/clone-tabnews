import React, { useState, useEffect, useCallback, useRef } from "react";

// Constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 8, y: 8 }];
const INITIAL_SNAKE2 = [{ x: 11, y: 11 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_DIRECTION2 = { x: -1, y: 0 };
const GAME_SPEEDS = {
  EASY: 200,
  NORMAL: 150,
  HARD: 100,
};

// Game modes
const GAME_MODES = {
  CLASSIC: {
    id: "CLASSIC",
    name: "Clássico",
    description: "Modo tradicional do Snake",
    icon: "🐍",
  },
  MAZE: {
    id: "MAZE",
    name: "Labirinto",
    description: "Desvie dos obstáculos",
    icon: "🧱",
  },
  TIMED: {
    id: "TIMED",
    name: "Contra o Tempo",
    description: "Colete o máximo de pontos antes do tempo acabar",
    icon: "⏱️",
  },
  NO_WALLS: {
    id: "NO_WALLS",
    name: "Sem Paredes",
    description: "Atravesse as bordas do mapa",
    icon: "🌀",
  },
  MULTIPLAYER: {
    id: "MULTIPLAYER",
    name: "Dois Jogadores",
    description: "Jogue com um amigo (WASD e Setas)",
    icon: "👥",
  },
};

// Power-up Types
const POWERUP_TYPES = {
  DOUBLE_POINTS: {
    id: "DOUBLE_POINTS",
    color: "from-yellow-400 to-yellow-600",
    shadow: "rgb(234 179 8)",
    duration: 10000,
    symbol: "💰",
    name: "Pontos Duplos",
  },
  SLOW_MOTION: {
    id: "SLOW_MOTION",
    color: "from-blue-400 to-blue-600",
    shadow: "rgb(59 130 246)",
    duration: 8000,
    symbol: "🐌",
    name: "Câmera Lenta",
  },
  INVULNERABLE: {
    id: "INVULNERABLE",
    color: "from-purple-400 to-purple-600",
    shadow: "rgb(147 51 234)",
    duration: 5000,
    symbol: "⭐",
    name: "Invencível",
  },
  GHOST: {
    id: "GHOST",
    color: "from-cyan-400 to-cyan-600",
    shadow: "rgb(6 182 212)",
    duration: 7000,
    symbol: "👻",
    name: "Atravessar Paredes",
  },
};

// Game storage keys
const HIGH_SCORE_KEY = "snakeGameHighScore";
const DIFFICULTY_KEY = "snakeGameDifficulty";

// Utility functions
const generateMazeObstacles = () => {
  const obstacles = [];
  const numObstacles = Math.floor(Math.random() * 5) + 5; // 5-10 obstacles

  for (let i = 0; i < numObstacles; i++) {
    const size = Math.floor(Math.random() * 3) + 2; // 2-4 cells
    const x = Math.floor(Math.random() * (GRID_SIZE - size));
    const y = Math.floor(Math.random() * (GRID_SIZE - size));

    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        if (Math.random() > 0.3) {
          // 70% chance of obstacle cell
          obstacles.push({ x: x + dx, y: y + dy });
        }
      }
    }
  }

  // Ensure starting areas are clear
  return obstacles.filter(
    (obs) =>
      !(obs.x >= 7 && obs.x <= 9 && obs.y >= 7 && obs.y <= 9) && // Snake 1 start area
      !(obs.x >= 10 && obs.x <= 12 && obs.y >= 10 && obs.y <= 12), // Snake 2 start area
  );
};

const generateRandomPosition = (
  currentSnake,
  currentSnake2,
  currentFood,
  currentPowerUp,
  obstacles = [],
) => {
  let newPos;
  do {
    newPos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    currentSnake.some(
      (segment) => segment.x === newPos.x && segment.y === newPos.y,
    ) ||
    currentSnake2?.some(
      (segment) => segment.x === newPos.x && segment.y === newPos.y,
    ) ||
    (currentFood && currentFood.x === newPos.x && currentFood.y === newPos.y) ||
    (currentPowerUp &&
      currentPowerUp.x === newPos.x &&
      currentPowerUp.y === newPos.y) ||
    obstacles.some((obs) => obs.x === newPos.x && obs.y === newPos.y)
  );
  return newPos;
};

const generateFood = (
  currentSnake,
  currentSnake2,
  currentPowerUp,
  obstacles,
) => {
  return generateRandomPosition(
    currentSnake,
    currentSnake2,
    null,
    currentPowerUp,
    obstacles,
  );
};

const generatePowerUp = (
  currentSnake,
  currentSnake2,
  currentFood,
  obstacles,
) => {
  const position = generateRandomPosition(
    currentSnake,
    currentSnake2,
    currentFood,
    null,
    obstacles,
  );
  const powerUpTypes = Object.values(POWERUP_TYPES);
  const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

  return {
    ...position,
    type,
  };
};

const isMobile = () => {
  if (typeof window === "undefined") return false;
  return /Mobi|Android|iPhone/i.test(navigator.userAgent);
};

// Part 2: Main Game Component and Logic
const SnakeGame = () => {
  // Game state
  const [gameMode, setGameMode] = useState("CLASSIC");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [snake2, setSnake2] = useState(INITIAL_SNAKE2);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [direction2, setDirection2] = useState(INITIAL_DIRECTION2);
  const [food, setFood] = useState({ x: 15, y: 8 }); // Fixed initial position
  const [powerUp, setPowerUp] = useState(null);
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState(0);
  const [score2, setScore2] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [difficulty, setDifficulty] = useState("NORMAL");
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeEffects, setActiveEffects] = useState({});

  // Refs
  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);
  const lastDirectionRef = useRef(direction);
  const lastDirection2Ref = useRef(direction2);
  const powerUpTimerRef = useRef(null);
  const effectTimersRef = useRef({});

  // Load saved configurations
  useEffect(() => {
    const savedScore = localStorage.getItem(HIGH_SCORE_KEY);
    const savedDifficulty = localStorage.getItem(DIFFICULTY_KEY);

    if (savedScore) {
      setHighScore(parseInt(savedScore));
    }
    if (savedDifficulty) {
      setDifficulty(savedDifficulty);
    }
  }, []);

  // Power-up spawn timer
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused && gameMode !== "MULTIPLAYER") {
      // Generate initial power-up
      if (!powerUp) {
        setPowerUp(generatePowerUp(snake, snake2, food, obstacles));
      }

      // Set up interval for new power-ups
      powerUpTimerRef.current = setInterval(() => {
        setPowerUp(generatePowerUp(snake, snake2, food, obstacles));
      }, 15000); // Increased interval to 15 seconds

      return () => {
        clearInterval(powerUpTimerRef.current);
        powerUpTimerRef.current = null;
      };
    }
  }, [
    gameStarted,
    gameOver,
    isPaused,
    gameMode,
    snake,
    snake2,
    food,
    obstacles,
    powerUp,
  ]);

  // Remove power-up if not collected
  useEffect(() => {
    if (powerUp) {
      const timer = setTimeout(() => {
        setPowerUp(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [powerUp]);

  // Timer for Timed Mode
  useEffect(() => {
    if (gameMode === "TIMED" && gameStarted && !gameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [gameMode, gameStarted, gameOver, isPaused]);

  const activatePowerUp = (type) => {
    setActiveEffects((prev) => ({
      ...prev,
      [type.id]: true,
    }));

    if (effectTimersRef.current[type.id]) {
      clearTimeout(effectTimersRef.current[type.id]);
    }

    effectTimersRef.current[type.id] = setTimeout(() => {
      setActiveEffects((prev) => ({
        ...prev,
        [type.id]: false,
      }));
      delete effectTimersRef.current[type.id];
    }, type.duration);
  };

  // Game logic
  const checkCollision = useCallback(
    (head, isSecondSnake = false) => {
      if (activeEffects.GHOST || gameMode === "NO_WALLS") {
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        return false;
      }

      if (activeEffects.INVULNERABLE) {
        return false;
      }

      // Wall collision
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        return true;
      }

      // Maze obstacles
      if (
        gameMode === "MAZE" &&
        obstacles.some((obs) => obs.x === head.x && obs.y === head.y)
      ) {
        return true;
      }

      // Self collision
      const snakeBody = isSecondSnake ? snake2 : snake;
      if (
        snakeBody
          .slice(1)
          .some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        return true;
      }

      // Other snake collision (multiplayer)
      if (gameMode === "MULTIPLAYER") {
        const otherSnake = isSecondSnake ? snake : snake2;
        if (
          otherSnake.some(
            (segment) => segment.x === head.x && segment.y === head.y,
          )
        ) {
          return true;
        }
      }

      return false;
    },
    [snake, snake2, gameMode, obstacles, activeEffects],
  );

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    // Move first snake
    setSnake((currentSnake) => {
      let head = {
        x: currentSnake[0].x + lastDirectionRef.current.x,
        y: currentSnake[0].y + lastDirectionRef.current.y,
      };

      if (checkCollision(head)) {
        if (gameMode === "MULTIPLAYER") {
          setWinner(2);
        }
        setGameOver(true);
        return currentSnake;
      }

      const newSnake = [head, ...currentSnake];

      if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        activatePowerUp(powerUp.type);
        setPowerUp(null);
      }

      if (head.x === food.x && head.y === food.y) {
        setFood(generateFood(newSnake, snake2, powerUp, obstacles));
        setScore((prev) => {
          const basePoints =
            difficulty === "HARD" ? 15 : difficulty === "NORMAL" ? 10 : 5;
          const points = activeEffects.DOUBLE_POINTS
            ? basePoints * 2
            : basePoints;
          const newScore = prev + points;

          if (newScore > highScore && gameMode === "CLASSIC") {
            setHighScore(newScore);
            localStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
          }
          return newScore;
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });

    // Move second snake in multiplayer
    if (gameMode === "MULTIPLAYER") {
      setSnake2((currentSnake) => {
        let head = {
          x: currentSnake[0].x + lastDirection2Ref.current.x,
          y: currentSnake[0].y + lastDirection2Ref.current.y,
        };

        if (checkCollision(head, true)) {
          setWinner(1);
          setGameOver(true);
          return currentSnake;
        }

        const newSnake = [head, ...currentSnake];

        if (head.x === food.x && head.y === food.y) {
          setFood(generateFood(snake, newSnake, powerUp, obstacles));
          setScore2((prev) => prev + 10);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }
  }, [
    food,
    gameOver,
    isPaused,
    gameStarted,
    checkCollision,
    powerUp,
    snake2,
    gameMode,
    difficulty,
    highScore,
    snake,
    obstacles,
    activeEffects.DOUBLE_POINTS,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (gameOver || !gameStarted) return;

      const key = e.key.toLowerCase();
      let newDirection = null;
      let isSecondSnake = false;

      if (gameMode === "MULTIPLAYER") {
        // Player 1 controls (WASD)
        switch (key) {
          case "w":
            newDirection = { x: 0, y: -1 };
            break;
          case "s":
            newDirection = { x: 0, y: 1 };
            break;
          case "a":
            newDirection = { x: -1, y: 0 };
            break;
          case "d":
            newDirection = { x: 1, y: 0 };
            break;
        }

        // Player 2 controls (Arrow keys)
        switch (key) {
          case "arrowup":
            newDirection = { x: 0, y: -1 };
            isSecondSnake = true;
            break;
          case "arrowdown":
            newDirection = { x: 0, y: 1 };
            isSecondSnake = true;
            break;
          case "arrowleft":
            newDirection = { x: -1, y: 0 };
            isSecondSnake = true;
            break;
          case "arrowright":
            newDirection = { x: 1, y: 0 };
            isSecondSnake = true;
            break;
        }
      } else {
        // Single player mode - both WASD and arrows work
        switch (key) {
          case "w":
          case "arrowup":
            newDirection = { x: 0, y: -1 };
            break;
          case "s":
          case "arrowdown":
            newDirection = { x: 0, y: 1 };
            break;
          case "a":
          case "arrowleft":
            newDirection = { x: -1, y: 0 };
            break;
          case "d":
          case "arrowright":
            newDirection = { x: 1, y: 0 };
            break;
        }
      }

      if (key === " ") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (key === "escape") {
        setShowSettings((prev) => !prev);
        return;
      }

      if (newDirection) {
        e.preventDefault();
        const currentDirection = isSecondSnake
          ? lastDirection2Ref.current
          : lastDirectionRef.current;
        const isOppositeDirection =
          currentDirection.x === -newDirection.x &&
          currentDirection.y === -newDirection.y;

        if (!isOppositeDirection) {
          if (isSecondSnake) {
            lastDirection2Ref.current = newDirection;
            setDirection2(newDirection);
          } else {
            lastDirectionRef.current = newDirection;
            setDirection(newDirection);
          }
        }
      }
    },
    [gameOver, gameStarted, gameMode],
  );

  // Event listeners and cleanup
  useEffect(() => {
    const handleKeyPressEvent = (e) => handleKeyPress(e);

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyPressEvent);

      return () => {
        window.removeEventListener("keydown", handleKeyPressEvent);
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (powerUpTimerRef.current) {
          clearInterval(powerUpTimerRef.current);
          powerUpTimerRef.current = null;
        }
        Object.values(effectTimersRef.current).forEach((timer) => {
          if (timer) {
            clearTimeout(timer);
          }
        });
        effectTimersRef.current = {};
      };
    }
    return undefined;
  }, [handleKeyPress]);

  // Game loop
  useEffect(() => {
    if (!gameOver && !isPaused && gameStarted) {
      const speed = activeEffects.SLOW_MOTION
        ? GAME_SPEEDS[difficulty] * 1.5
        : GAME_SPEEDS[difficulty];
      gameLoopRef.current = setInterval(moveSnake, speed);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [
    moveSnake,
    gameOver,
    isPaused,
    gameStarted,
    difficulty,
    activeEffects.SLOW_MOTION,
  ]);

  // Game controls
  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;

    if (gameMode === "MULTIPLAYER") {
      setSnake2(INITIAL_SNAKE2);
      setDirection2(INITIAL_DIRECTION2);
      lastDirection2Ref.current = INITIAL_DIRECTION2;
      setScore2(0);
    }

    setFood(generateFood(INITIAL_SNAKE, null, null, obstacles));
    setPowerUp(null);
    setGameOver(false);
    setWinner(null);
    setScore(0);
    setIsPaused(false);
    setShowSettings(false);
    setActiveEffects({});

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (gameMode === "TIMED") {
      setTimeLeft(60);
    }

    if (gameMode === "MAZE") {
      const newObstacles = generateMazeObstacles();
      setObstacles(newObstacles);
      setFood(generateFood(INITIAL_SNAKE, null, null, newObstacles));
    } else {
      setObstacles([]);
    }
  }, [gameMode]);

  const startGame = useCallback(() => {
    resetGame();
    setGameStarted(true);
  }, [resetGame]);

  // Render methods
  const renderGameModeSelector = () => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Modo de Jogo</h2>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(GAME_MODES)
          .filter((mode) => !isMobile() || mode.id !== "MULTIPLAYER")
          .map((mode) => (
            <button
              key={mode.id}
              onClick={() => setGameMode(mode.id)}
              className={`p-4 rounded-lg transition-all text-left ${
                gameMode === mode.id
                  ? "bg-green-500/80 text-white"
                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
              }`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="font-semibold">{mode.name}</div>
              <div className="text-sm opacity-75">{mode.description}</div>
            </button>
          ))}
      </div>
    </div>
  );

  const renderDifficultySelector = () => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-200">Dificuldade</h2>
      <div className="flex justify-center gap-3">
        {Object.keys(GAME_SPEEDS).map((level) => (
          <button
            key={level}
            onClick={() => {
              setDifficulty(level);
              localStorage.setItem(DIFFICULTY_KEY, level);
            }}
            className={`px-4 py-2 rounded-lg transition-all ${
              difficulty === level
                ? "bg-green-500/80 text-white"
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            }`}
          >
            {level.charAt(0) + level.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const renderGameBoard = () => (
    <div
      className="relative bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm"
      style={{
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
      }}
    >
      {/* Grade do jogo */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          opacity: 0.1,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div key={i} className="border border-gray-600" />
        ))}
      </div>

      {/* Obstáculos (Modo Labirinto) */}
      {gameMode === "MAZE" &&
        obstacles.map((obstacle, index) => (
          <div
            key={`obstacle-${index}`}
            className="absolute bg-gray-700/90 rounded-sm border border-gray-600/50"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: obstacle.x * CELL_SIZE,
              top: obstacle.y * CELL_SIZE,
            }}
          />
        ))}

      {/* Comida */}
      <div
        className="absolute bg-gradient-to-br from-red-400 to-pink-500 rounded-full transition-all duration-100 shadow-lg shadow-red-500/50 animate-pulse"
        style={{
          width: CELL_SIZE - 2,
          height: CELL_SIZE - 2,
          left: food.x * CELL_SIZE,
          top: food.y * CELL_SIZE,
        }}
      />

      {/* Power-up */}
      {powerUp && (
        <div
          className={`absolute bg-gradient-to-br rounded-full transition-all duration-100 shadow-lg animate-pulse ${powerUp.type.color}`}
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: powerUp.x * CELL_SIZE,
            top: powerUp.y * CELL_SIZE,
            boxShadow: `0 10px 15px -3px ${powerUp.type.shadow.replace("/50", "")}, 0 4px 6px -4px ${powerUp.type.shadow.replace("/50", "")}`,
            opacity: 0.5,
          }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-sm">
            {powerUp.type.symbol}
          </span>
        </div>
      )}

      {/* Cobra 1 */}
      {snake.map((segment, index) => (
        <div
          key={`snake1-${segment.x}-${segment.y}-${index}`}
          className={`absolute rounded transition-all duration-100 shadow-lg ${
            activeEffects.INVULNERABLE
              ? "bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse"
              : activeEffects.GHOST
                ? "bg-gradient-to-r from-cyan-400 to-cyan-600 opacity-70"
                : "bg-gradient-to-r from-green-400 to-emerald-500"
          }`}
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: segment.x * CELL_SIZE,
            top: segment.y * CELL_SIZE,
          }}
        />
      ))}

      {/* Cobra 2 (Modo Multiplayer) */}
      {gameMode === "MULTIPLAYER" &&
        snake2.map((segment, index) => (
          <div
            key={`snake2-${segment.x}-${segment.y}-${index}`}
            className="absolute bg-gradient-to-r from-blue-400 to-purple-500 rounded transition-all duration-100 shadow-lg"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
            }}
          />
        ))}
    </div>
  );

  const renderGameStatus = () => (
    <div className="mb-6 space-y-2 text-center">
      {gameMode === "TIMED" && (
        <div className="text-2xl font-bold text-yellow-400">
          Tempo: {timeLeft}s ⏱️
        </div>
      )}

      {gameMode === "MULTIPLAYER" ? (
        <div className="flex justify-center gap-8">
          <div className="text-2xl">
            <span className="text-green-400">Jogador 1:</span> {score}
          </div>
          <div className="text-2xl">
            <span className="text-blue-400">Jogador 2:</span> {score2}
          </div>
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Pontuação: {score}
          </div>
          <div className="text-gray-300">
            Recorde:{" "}
            <span className="text-green-400 font-bold">{highScore}</span>
          </div>
        </>
      )}
    </div>
  );

  const renderActiveEffects = () =>
    Object.entries(activeEffects).some(([_, active]) => active) && (
      <div className="fixed top-4 right-4 space-y-2 z-20">
        {Object.entries(activeEffects).map(([effectId, active]) => {
          if (!active) return null;
          const effect = POWERUP_TYPES[effectId];
          return (
            <div
              key={effectId}
              className={`px-3 py-2 rounded-lg bg-gradient-to-r ${effect.color} shadow-lg animate-pulse`}
            >
              {effect.symbol} {effect.name}
            </div>
          );
        })}
      </div>
    );

  const handleDirectionChange = (newDirection) => {
    if (gameOver || !gameStarted) return;

    const currentDirection = lastDirectionRef.current;
    const isOppositeDirection =
      currentDirection.x === -newDirection.x &&
      currentDirection.y === -newDirection.y;

    if (!isOppositeDirection) {
      lastDirectionRef.current = newDirection;
      setDirection(newDirection);
    }
  };

  const renderGameControls = () => {
    if (!gameStarted || !isMobile()) return null;

    return (
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          className="p-4 bg-blue-500/80 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/90 active:bg-blue-700/90 shadow-lg transition-all"
          onClick={() => handleDirectionChange({ x: 0, y: -1 })}
          aria-label="Mover para cima"
        >
          ⬆️
        </button>
        <div className="flex gap-4">
          <button
            className="p-4 bg-blue-500/80 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/90 active:bg-blue-700/90 shadow-lg transition-all"
            onClick={() => handleDirectionChange({ x: -1, y: 0 })}
            aria-label="Mover para esquerda"
          >
            ⬅️
          </button>
          <button
            className="p-4 bg-blue-500/80 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/90 active:bg-blue-700/90 shadow-lg transition-all"
            onClick={() => handleDirectionChange({ x: 1, y: 0 })}
            aria-label="Mover para direita"
          >
            ➡️
          </button>
        </div>
        <button
          className="p-4 bg-blue-500/80 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/90 active:bg-blue-700/90 shadow-lg transition-all"
          onClick={() => handleDirectionChange({ x: 0, y: 1 })}
          aria-label="Mover para baixo"
        >
          ⬇️
        </button>
      </div>
    );
  };

  const renderGameInstructions = () => (
    <div className="mt-4 text-center text-gray-300">
      {gameMode === "MULTIPLAYER" ? (
        <>
          <p>Jogador 1: WASD para mover</p>
          <p>Jogador 2: Setas para mover</p>
        </>
      ) : (
        <p>Use as setas ou WASD para mover ⬆️ ⬇️ ⬅️ ➡️</p>
      )}
      <p>Pressione espaço para pausar ⏸️ | ESC para configurações ⚙️</p>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="mt-8 flex justify-center gap-4 flex-wrap">
      <a
        href="https://github.com/joaooliveira10"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-700/80 transition-all shadow-lg group"
        aria-label="GitHub"
      >
        <svg
          className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </a>

      <a
        href="https://www.linkedin.com/in/joaooliveira10/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-2 bg-blue-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-blue-700/80 transition-all shadow-lg group"
        aria-label="LinkedIn"
      >
        <svg
          className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </a>
      <a
        href="https://www.instagram.com/joaoangelloro/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-2 bg-pink-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-pink-700/80 transition-all shadow-lg group"
        aria-label="Instagram"
      >
        <svg
          className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
        Instagram
      </a>
    </div>
  );

  // Add state for client-side rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialize food position after client-side render
    setFood(generateFood(INITIAL_SNAKE, null, null, []));
  }, []);

  // Main render
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white">
      {isClient && !gameStarted ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="p-8 bg-gray-800/90 backdrop-blur-sm rounded-xl text-center border border-gray-700 shadow-xl max-w-2xl w-full mx-4">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Snake Game 🐍
            </h1>

            {renderGameModeSelector()}
            {gameMode !== "MULTIPLAYER" && renderDifficultySelector()}

            <button
              onClick={startGame}
              className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl rounded-lg hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all shadow-xl"
            >
              Iniciar Jogo ▶️
            </button>
          </div>

          {/* Power-up Legend */}
          {gameMode !== "MULTIPLAYER" && (
            <div className="fixed bottom-4 left-4 p-4 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl max-w-xs">
              <h3 className="text-lg font-bold mb-2 text-blue-400">
                Power-ups:
              </h3>
              <ul className="space-y-2">
                {Object.values(POWERUP_TYPES).map((powerUp) => (
                  <li
                    key={powerUp.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`p-1 rounded bg-gradient-to-r ${powerUp.color}`}
                    >
                      {powerUp.symbol}
                    </span>
                    <span className="text-gray-300">{powerUp.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          {renderGameStatus()}
          {renderActiveEffects()}
          {renderGameBoard()}
          {renderGameControls()}
          {renderGameInstructions()}
          {renderSocialLinks()}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/75 backdrop-blur-sm">
              <div className="p-8 bg-gray-800/90 backdrop-blur-sm rounded-xl text-center border border-gray-700 shadow-xl">
                <h2 className="mb-4 text-4xl font-bold text-red-500">
                  Game Over! 💀
                </h2>

                {gameMode === "MULTIPLAYER" ? (
                  <p className="mb-4 text-2xl text-gray-300">
                    Vencedor:{" "}
                    <span className="text-green-400 font-bold">
                      Jogador {winner}
                    </span>
                    ! 🏆
                  </p>
                ) : gameMode === "TIMED" ? (
                  <p className="mb-4 text-2xl text-gray-300">
                    Tempo Esgotado! Pontuação:{" "}
                    <span className="text-green-400 font-bold">{score}</span>
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-2xl text-gray-300">
                      Pontuação Final:{" "}
                      <span className="text-green-400 font-bold">{score}</span>
                    </p>
                    {score === highScore && score > 0 && (
                      <p className="mb-4 text-lg text-green-400">
                        Novo recorde! 🏆
                      </p>
                    )}
                  </>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      resetGame();
                      setGameStarted(false);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
                  >
                    Voltar ao Menu Principal 🏠
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full px-6 py-3 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-all"
                  >
                    Tentar Novamente 🔄
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pause Overlay */}
          {!gameOver && isPaused && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="p-8 bg-gray-800/90 backdrop-blur-sm rounded-xl text-center border border-gray-700 shadow-xl">
                <h2 className="text-4xl font-bold text-blue-400">Pausado ⏸️</h2>
                <p className="mt-4 text-gray-300">
                  Pressione espaço para continuar
                </p>
              </div>
            </div>
          )}

          {/* Settings Overlay */}
          {showSettings && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="p-8 bg-gray-800/90 backdrop-blur-sm rounded-xl text-center border border-gray-700 shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-blue-400">
                  Configurações ⚙️
                </h2>

                {gameMode !== "MULTIPLAYER" && renderDifficultySelector()}

                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 bg-blue-500/80 text-white rounded-lg hover:bg-blue-600/80 transition-all"
                >
                  Voltar ao Jogo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SnakeGame;
