"use client";  
// Next.js directive: marks this component as a client-side component.
// Necessary because we use React hooks (useState, useEffect, etc.) and browser APIs like window/localStorage.

import { useState, useEffect, useCallback } from "react"; 
// React hooks: 
// useState → for managing component state
// useEffect → for side effects like event listeners or intervals
// useCallback → memoize functions to avoid unnecessary re-creations

import { Play, RotateCcw } from "lucide-react"; 
// Importing icons from lucide-react library. 
// Play → used on start overlay
// RotateCcw → used on the "Play Again" button

import { Bird, Pipe, ScoreBoard, Overlay } from "./GameObjects"; 
// Importing custom components representing parts of the game

// ==================================================================
// CONSTANTS: Game Physics & Dimensions
// ==================================================================
const BIRD_WIDTH = 40;       // Width of bird (px)
const BIRD_HEIGHT = 30;      // Height of bird (px)
const PIPE_WIDTH = 60;       // Width of pipes (px)
const PIPE_GAP = 200;        // Vertical gap between top & bottom pipes
const GRAVITY = 0.4;         // Gravity pulls bird downward
const JUMP_FORCE = -7;       // Upward velocity when bird jumps
const PIPE_SPEED = 2;        // Horizontal speed of pipes

// ==================================================================
// MAIN GAME COMPONENT
// ==================================================================
export default function FlappyGame() {
  // -------------------------------
  // STATE VARIABLES
  // -------------------------------
  const [bird, setBird] = useState({ x: 100, y: 300, velocity: 0 });
  // Bird object:
  // x → horizontal position
  // y → vertical position
  // velocity → vertical speed (positive down, negative up)

  const [pipes, setPipes] = useState([]);
  // Array of pipe objects. Each pipe has:
  // x → horizontal position
  // topHeight → height of top pipe
  // bottomHeight → height of bottom pipe
  // passed → boolean for scoring

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  // Flags for tracking game status

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  // Scores

  const [gameWidth, setGameWidth] = useState(800);
  const [gameHeight, setGameHeight] = useState(600);
  // Game area dimensions (responsive)

  // ==================================================================
  // FUNCTION: Bird jump
  // ==================================================================
  const jump = useCallback(() => {
    if (!gameStarted) {
      // First jump starts the game
      setGameStarted(true);

      // Create first pipe randomly
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

    if (gameOver) return; // Cannot jump after game over

    // Apply jump force
    setBird((prev) => ({ ...prev, velocity: JUMP_FORCE }));
  }, [gameStarted, gameOver, gameWidth, gameHeight]);

  // ==================================================================
  // FUNCTION: Reset Game
  // ==================================================================
  const resetGame = () => {
    setBird({ x: 100, y: gameHeight / 2, velocity: 0 }); // Reset bird position
    setPipes([]); // Remove all pipes
    setGameStarted(false);
    setGameOver(false);
    setScore(0); // Reset score
  };

  // ==================================================================
  // HANDLE WINDOW RESIZE
  // ==================================================================
  useEffect(() => {
    const handleResize = () => {
      setGameWidth(window.innerWidth);
      setGameHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // This ensures game canvas adjusts to window size dynamically

  // ==================================================================
  // INITIAL SETUP ON MOUNT
  // ==================================================================
  useEffect(() => {
    if (typeof window === "undefined") return; // Check for SSR

    setGameWidth(window.innerWidth);
    setGameHeight(window.innerHeight);

    setBird((prev) => ({ ...prev, y: window.innerHeight / 2 })); 
    // Place bird vertically in the middle

    const stored = parseInt(localStorage.getItem("flappyHighScore") || "0");
    setHighScore(Number.isNaN(stored) ? 0 : stored); 
    // Load previous high score from localStorage
  }, []);

  // ==================================================================
  // KEYBOARD CONTROL: Spacebar triggers jump
  // ==================================================================
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

  // ==================================================================
  // MAIN GAME LOOP: Bird + Pipe movement
  // ==================================================================
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // -------------------------------
      // BIRD MOVEMENT
      // -------------------------------
      setBird((prev) => {
        const newY = prev.y + prev.velocity;  // move bird
        const newVelocity = prev.velocity + GRAVITY; // gravity effect

        if (newY <= 0 || newY >= gameHeight - BIRD_HEIGHT) {
          // Collision with floor/ceiling
          setGameOver(true);
          return prev;
        }

        return { ...prev, y: newY, velocity: newVelocity };
      });

      // -------------------------------
      // PIPE MOVEMENT
      // -------------------------------
      setPipes((prev) => {
        let newPipes = prev.map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED }));
        // Move each pipe left

        newPipes = newPipes.filter((pipe) => pipe.x > -PIPE_WIDTH); 
        // Remove pipes that went off-screen

        // Generate new pipe if needed
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < gameWidth - 250) {
          const topHeight = Math.random() * (gameHeight - PIPE_GAP - 100) + 50;
          newPipes.push({
            x: gameWidth,
            topHeight,
            bottomHeight: gameHeight - topHeight - PIPE_GAP,
            passed: false,
          });
        }

        return newPipes;
      });
    }, 16); // 16ms ≈ 60 FPS

    return () => clearInterval(gameLoop); // Cleanup
  }, [gameStarted, gameOver, gameHeight, gameWidth]);

  // ==================================================================
  // COLLISION DETECTION & SCORING
  // ==================================================================
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    let collided = false;
    let newPipes = pipes.map((pipe) => ({ ...pipe })); // copy for mutability
    let newlyPassed = 0; // track scoring

    for (let i = 0; i < newPipes.length; i++) {
      const pipe = newPipes[i];

      // Collision check (bird inside pipe boundaries)
      if (
        bird.x + BIRD_WIDTH > pipe.x &&
        bird.x < pipe.x + PIPE_WIDTH &&
        (bird.y < pipe.topHeight || bird.y + BIRD_HEIGHT > gameHeight - pipe.bottomHeight)
      ) {
        collided = true;
        break;
      }

      // Scoring: bird passed the pipe
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
  }, [bird, pipes, gameOver, gameStarted, highScore, gameHeight]);

  // ==================================================================
  // RENDER
  // ==================================================================
  return (
    <div
      className="relative overflow-hidden" 
      // Tailwind CSS: 
      // "relative" → allows child elements (Bird, Pipes, Overlays) to use absolute positioning 
      // "overflow-hidden" → prevents scrollbars when bird/pipes move outside container
      style={{
        width: gameWidth,
        height: gameHeight,
        backgroundImage: `url('https://images.unsplash.com/photo-1684208080520-406372df6dea?fit=fillmax&h=400&w=800')`,
        backgroundSize: "cover",      // cover entire container
        backgroundPosition: "center", // center the background
      }}
      onClick={jump} // Click anywhere to jump
    >
      {/* Bird */}
      <Bird bird={bird} />

      {/* Pipes */}
      {pipes.map((pipe, i) => (
        <Pipe key={i} pipe={pipe} />
      ))}

      {/* Scoreboard */}
      <ScoreBoard score={score} highScore={highScore} />

      {/* Start Overlay */}
      {!gameStarted && (
        <Overlay type="start">
          <h1 className="text-4xl font-bold mb-4">Flappy Bird</h1>
          {/* Tailwind: text size, bold, margin-bottom */}
          <p className="text-lg mb-6">Click or press Space to start</p>
          <Play className="w-12 h-12 animate-pulse" /> 
          {/* Tailwind: width, height, animation pulse */}
        </Overlay>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <Overlay type="gameover">
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
        </Overlay>
      )}
    </div>
  );
}

