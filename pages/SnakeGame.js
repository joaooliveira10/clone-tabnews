import React, { useState, useEffect, useCallback } from 'react';


const SnakeGame = () => {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const INITIAL_SNAKE = [{ x: 8, y: 8 }];
  const INITIAL_DIRECTION = { x: 1, y: 0 };
  const GAME_SPEED = 150;

  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Gerar nova posição da comida
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    return newFood;
  }, []);

  // Verificar colisões
  const checkCollision = useCallback((head) => {
    // Colisão com as paredes
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Colisão com o próprio corpo
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);

  // Movimentação da cobra
  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    const newSnake = [...snake];
    const head = {
      x: newSnake[0].x + direction.x,
      y: newSnake[0].y + direction.y
    };

    if (checkCollision(head)) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      setFood(generateFood());
      setScore(prev => prev + 10);
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, gameOver, isPaused, checkCollision, generateFood]);

  // Controles do teclado
  const handleKeyPress = useCallback((e) => {
    if (gameOver) return;

    const keyDirections = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    };

    if (e.key === ' ') {
      setIsPaused(prev => !prev);
      return;
    }

    const newDirection = keyDirections[e.key];
    if (newDirection) {
      // Prevenir movimento na direção oposta
      const isOppositeDirection = 
        (direction.x === -newDirection.x && direction.y === -newDirection.y) ||
        (direction.x === newDirection.x && direction.y === newDirection.y);

      if (!isOppositeDirection) {
        setDirection(newDirection);
      }
    }
  }, [direction, gameOver]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Reiniciar jogo
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-4 text-2xl font-bold">Pontuação: {score}</div>
      
      <div 
        className="relative bg-white border-2 border-gray-300 rounded-lg shadow-lg"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE
        }}
      >
        {/* Comida */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE
          }}
        />

        {/* Cobra */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-green-500 rounded"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE
            }}
          />
        ))}
      </div>

      {/* Overlay de Game Over */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg text-center">
            <h2 className="mb-4 text-2xl font-bold">Game Over!</h2>
            <p className="mb-4">Pontuação Final: {score}</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="mt-4 text-center text-gray-600">
        <p>Use as setas do teclado para mover</p>
        <p>Pressione espaço para pausar</p>
      </div>
    </div>
  );
};

export default SnakeGame;