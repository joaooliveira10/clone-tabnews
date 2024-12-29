import React, { useState, useEffect, useCallback, useRef } from 'react';

// Constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 8, y: 8 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150;
const HIGH_SCORE_KEY = 'snakeGameHighScore';

// Utility functions
const generateFood = (currentSnake) => {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
  return newFood;
};

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone/i.test(navigator.userAgent);
};

const SnakeGame = () => {
  // State management
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(() => generateFood(INITIAL_SNAKE));
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Carrega o highScore do localStorage apenas no client-side
  useEffect(() => {
    const savedScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedScore) {
      setHighScore(parseInt(savedScore));
    }
  }, []);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Refs
  const gameLoopRef = useRef(null);
  const lastDirectionRef = useRef(direction);

  // Game logic
  const checkCollision = useCallback((head) => {
    return (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE ||
      snake.slice(1).some((segment) => segment.x === head.x && segment.y === head.y)
    );
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake((currentSnake) => {
      const head = {
        x: currentSnake[0].x + lastDirectionRef.current.x,
        y: currentSnake[0].y + lastDirectionRef.current.y,
      };

      if (checkCollision(head)) {
        setGameOver(true);
        return currentSnake;
      }

      const newSnake = [head, ...currentSnake];

      if (head.x === food.x && head.y === food.y) {
        setFood(generateFood(newSnake));
        setScore((prev) => {
          const newScore = prev + 10;
          if (newScore > highScore) {
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
  }, [food, gameOver, isPaused, gameStarted, checkCollision, highScore]);

  const handleDirectionChange = useCallback((newDirection) => {
    const isOppositeDirection =
      lastDirectionRef.current.x === -newDirection.x &&
      lastDirectionRef.current.y === -newDirection.y;

    if (!isOppositeDirection) {
      lastDirectionRef.current = newDirection;
      setDirection(newDirection);
    }
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (gameOver || !gameStarted) return;

    const key = e.key.toLowerCase();
    let newDirection = null;

    // Mapeamento de teclas para direções
    switch (key) {
      case 'arrowup':
      case 'w':
        newDirection = { x: 0, y: -1 };
        break;
      case 'arrowdown':
      case 's':
        newDirection = { x: 0, y: 1 };
        break;
      case 'arrowleft':
      case 'a':
        newDirection = { x: -1, y: 0 };
        break;
      case 'arrowright':
      case 'd':
        newDirection = { x: 1, y: 0 };
        break;
      case ' ':
        setIsPaused((prev) => !prev);
        return;
      default:
        return;
    }

    if (newDirection) {
      e.preventDefault();
      handleDirectionChange(newDirection);
    }
  }, [gameOver, gameStarted, handleDirectionChange]);

  // Game loop
  useEffect(() => {
    if (!gameOver && !isPaused && gameStarted) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [moveSnake, gameOver, isPaused, gameStarted]);

  // Event listeners
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress]);

  // Game controls
  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameStarted(true);
  }, [resetGame]);

  // Render methods
  const renderControls = () => {
    if (!gameStarted || !isMobile()) return null;

    return (
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:bg-blue-700"
          onClick={() => handleDirectionChange({ x: 0, y: -1 })}
          aria-label="Mover para cima"
        >
          ⬆️
        </button>
        <div className="flex gap-4">
          <button
            className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:bg-blue-700"
            onClick={() => handleDirectionChange({ x: -1, y: 0 })}
            aria-label="Mover para esquerda"
          >
            ⬅️
          </button>
          <button
            className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:bg-blue-700"
            onClick={() => handleDirectionChange({ x: 1, y: 0 })}
            aria-label="Mover para direita"
          >
            ➡️
          </button>
        </div>
        <button
          className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:bg-blue-700"
          onClick={() => handleDirectionChange({ x: 0, y: 1 })}
          aria-label="Mover para baixo"
        >
          ⬇️
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {!gameStarted ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="p-8 bg-white rounded-lg text-center">
            <h1 className="text-4xl font-bold mb-6">Snake Game 🐍</h1>
            <p className="mb-4 text-gray-600">Recorde: {highScore} pontos</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-500 text-white text-xl rounded-lg hover:bg-green-600 active:bg-green-700 transform hover:scale-105 transition-transform"
              aria-label="Iniciar Jogo"
            >
              Iniciar Jogo ▶️
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-2 text-center">
            <div className="text-2xl font-bold">Pontuação: {score}</div>
            <div className="text-gray-600">Recorde: {highScore}</div>
          </div>
          
          <div
            className="relative bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            }}
          >
            <div
              className="absolute bg-red-500 rounded-full transition-all duration-100"
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
              }}
            />
            {snake.map((segment, index) => (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className="absolute bg-green-500 rounded transition-all duration-100"
                style={{
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                }}
              />
            ))}
          </div>

          {renderControls()}

          <div className="mt-4 text-center text-gray-600">
            <p>Use as setas ou WASD para mover ⬆️ ⬇️ ⬅️ ➡️</p>
            <p>Pressione espaço para pausar ⏸️</p>
          </div>

          {/* Social Media Links */}
          <div className="mt-8 flex justify-center gap-6">
            <a
              href="https://github.com/joaooliveira10"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            
            <a
              href="https://www.linkedin.com/in/joaooliveira10/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            
            <a
              href="https://www.instagram.com/joaoangelloro/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </a>
          </div>
        </>
      )}

      {gameOver && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-8 bg-white rounded-lg text-center">
            <h2 className="mb-4 text-3xl font-bold">Game Over! 💀</h2>
            <p className="mb-2 text-xl">Pontuação Final: {score} 🎉</p>
            {score === highScore && score > 0 && (
              <p className="mb-4 text-lg text-green-600">Novo recorde! 🏆</p>
            )}
            <button
              onClick={() => {
                resetGame();
                setGameStarted(false);
              }}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700"
              aria-label="Voltar ao Menu Principal"
            >
              Voltar ao Menu Principal 🏠
            </button>
          </div>
        </div>
      )}

      {!gameOver && isPaused && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-30">
          <div className="p-8 bg-white rounded-lg text-center">
            <h2 className="text-3xl font-bold">Pausado ⏸️</h2>
            <p className="mt-2 text-gray-600">Pressione espaço para continuar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;