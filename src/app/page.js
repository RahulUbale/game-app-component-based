"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, RotateCcw } from "lucide-react";

// -------------------------------
// CONSTANTS (game physics)
// -------------------------------
const BIRD_WIDTH = 40;       // Bird width
const BIRD_HEIGHT = 30;      // Bird height
const PIPE_WIDTH = 60;       // Pipe width
const PIPE_GAP = 200;        // Gap between top and bottom pipe
const GRAVITY = 0.4;         // Bird falls speed
const JUMP_FORCE = -7;       // Bird jump power
const PIPE_SPEED = 2;        // Pipe move speed

// -------------------------------
// MAIN COMPONENT
// -------------------------------
export default function Page() {
  // Bird state (x, y, velocity)
  const [bird, setBird] = useState({
    x: 100,
    // stable fallback to avoid SSR/client mismatch; updated on mount
    y: 300,
    velocity: 0,
  });

  // Pipes array (each pipe has x, topHeight, bottomHeight, passed)
  const [pipes, setPipes] = useState([]);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Score tracking
  const [score, setScore] = useState(0);
  // avoid reading localStorage during render to prevent hydration mismatch
  const [highScore, setHighScore] = useState(0);

  // Game width & height (responsive)
  const [gameWidth, setGameWidth] = useState(
    /* use a stable fallback so server and initial client render match */
    800
  );
  const [gameHeight, setGameHeight] = useState(
    /* use a stable fallback so server and initial client render match */
    600
  );

  // -------------------------------
  // Bird jump function
  // -------------------------------
  const jump = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      // create first pipe with proper bottomHeight so collision math is correct
      const topH = Math.random() * (gameHeight - PIPE_GAP - 100) + 50;
      setPipes([
        {
          x: gameWidth,
          topHeight: topH,
          bottomHeight: gameHeight - topH - PIPE_GAP,
          passed: false,
        },
      ]);
      return;
    }
    if (gameOver) return;
    setBird((prev) => ({ ...prev, velocity: JUMP_FORCE }));
  }, [gameStarted, gameOver, gameWidth, gameHeight]);

  // -------------------------------
  // Reset game
  // -------------------------------
  const resetGame = () => {
    setBird({ x: 100, y: gameHeight / 2, velocity: 0 });
    setPipes([]);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
  };

  // -------------------------------
  // Handle screen resize
  // -------------------------------
  useEffect(() => {
    const handleResize = () => {
      setGameWidth(window.innerWidth);
      setGameHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Run once on mount to set window-dependent state and read localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    // set up accurate sizes on client after hydration to avoid mismatch
    setGameWidth(window.innerWidth);
    setGameHeight(window.innerHeight);

    // center bird vertically using the actual height
    setBird((prev) => ({ ...prev, y: window.innerHeight / 2 }));

    // read persisted high score on client only
    const stored = parseInt(localStorage.getItem("flappyHighScore") || "0");
    setHighScore(Number.isNaN(stored) ? 0 : stored);
  }, []);

  // -------------------------------
  // Keyboard controls
  // -------------------------------
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [jump]);

  // -------------------------------
  // Main game loop (bird + pipes)
  // -------------------------------
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // Bird movement
      setBird((prev) => {
        const newY = prev.y + prev.velocity;
        const newVelocity = prev.velocity + GRAVITY;

        if (newY <= 0 || newY >= gameHeight - BIRD_HEIGHT) {
          setGameOver(true);
          return prev;
        }
        return { ...prev, y: newY, velocity: newVelocity };
      });

      // Pipe movement
      setPipes((prev) => {
        let newPipes = prev.map((pipe) => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED,
        }));
        newPipes = newPipes.filter((pipe) => pipe.x > -PIPE_WIDTH);

        if (
          newPipes.length === 0 ||
          newPipes[newPipes.length - 1].x < gameWidth - 250
        ) {
          const topHeight =
            Math.random() * (gameHeight - PIPE_GAP - 100) + 50;
          newPipes.push({
            x: gameWidth,
            topHeight,
            bottomHeight: gameHeight - topHeight - PIPE_GAP,
            passed: false,
          });
        }

        return newPipes;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, gameHeight, gameWidth]);

  // -------------------------------
  // Collision detection + scoring
  // -------------------------------
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkCollisions = () => {
      let collided = false;
      // build a new pipes array so we don't mutate state directly
      let newPipes = pipes.map((pipe) => ({ ...pipe }));
      let newlyPassed = 0;

      for (let i = 0; i < newPipes.length; i++) {
        const pipe = newPipes[i];
        // collision
        if (
          bird.x + BIRD_WIDTH > pipe.x &&
          bird.x < pipe.x + PIPE_WIDTH &&
          (bird.y < pipe.topHeight || bird.y + BIRD_HEIGHT > gameHeight - pipe.bottomHeight)
        ) {
          collided = true;
          break;
        }

        // scoring: count pipes that the bird has just passed
        if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
          pipe.passed = true;
          newlyPassed += 1;
        }
      }

      if (collided) {
        setGameOver(true);
        return;
      }

      if (newlyPassed > 0) {
        setPipes(newPipes);
        setScore((prev) => {
          const newScore = prev + newlyPassed;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("flappyHighScore", newScore.toString());
          }
          return newScore;
        });
      }
    };

    checkCollisions();
  }, [bird, pipes, gameOver, gameStarted, highScore, gameHeight]);

  // -------------------------------
  // RENDER (UI)
  // -------------------------------
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: gameWidth,
        height: gameHeight,
        backgroundImage: `url('https://images.unsplash.com/photo-1684208080520-406372df6dea?fit=fillmax&h=400&w=800')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={jump}
    >
      {/* Bird */}
      <div
        style={{
          position: "absolute",
          left: bird.x,
          top: bird.y,
          width: BIRD_WIDTH,
          height: BIRD_HEIGHT,
          backgroundColor: "yellow",
          border: "2px solid orange",
          borderRadius: "8px",
          transform: `rotate(${Math.min(bird.velocity * 3, 45)}deg)`,
        }}
      >
        {/* Eye */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "black",
            position: "absolute",
            top: 6,
            left: 25,
          }}
        />
        {/* Beak */}
        <div
          style={{
            width: 10,
            height: 6,
            backgroundColor: "orange",
            position: "absolute",
            top: 12,
            left: 38,
            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          }}
        />
        {/* Wing */}
        <div
          style={{
            width: 14,
            height: 10,
            backgroundColor: "gold",
            borderRadius: "5px",
            position: "absolute",
            top: 10,
            left: 5,
          }}
        />
      </div>

      {/* Pipes */}
      {pipes.map((pipe, index) => (
        <div key={index}>
          {/* Top pipe */}
          <div
            className="absolute bg-green-600 border-2 border-green-800"
            style={{
              left: pipe.x,
              top: 0,
              width: PIPE_WIDTH,
              height: pipe.topHeight,
            }}
          >
            {/* Pipe cap */}
            <div
              className="absolute bg-green-500 border-t-4 border-green-700"
              style={{
                bottom: 0,
                left: -5,
                width: PIPE_WIDTH + 10,
                height: 20,
              }}
            />
          </div>

          {/* Bottom pipe */}
          <div
            className="absolute bg-green-600 border-2 border-green-800"
            style={{
              left: pipe.x,
              bottom: 0,
              width: PIPE_WIDTH,
              height: pipe.bottomHeight,
            }}
          >
            {/* Pipe cap */}
            <div
              className="absolute bg-green-500 border-b-4 border-green-700"
              style={{
                top: 0,
                left: -5,
                width: PIPE_WIDTH + 10,
                height: 20,
              }}
            />
          </div>
        </div>
      ))}

      {/* Score */}
      <div className="absolute top-4 left-4 text-white text-2xl font-bold bg-black bg-opacity-50 px-3 py-1 rounded">
        {score}
      </div>

      {/* High Score */}
      <div className="absolute top-4 right-4 text-white text-sm font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
        Best: {highScore}
      </div>

      {/* Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
          <h1 className="text-4xl font-bold mb-4">Flappy Bird</h1>
          <p className="text-lg mb-6">Click or press Space to start</p>
          <Play className="w-12 h-12 animate-pulse" />
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white">
          <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
          <p className="text-xl mb-2">Score: {score}</p>
          <p className="text-lg mb-6">Best: {highScore}</p>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
