"use client";  
// Next.js requires this "use client" directive for components that run in the browser.
// Client components can use things like state, effects, and event handlers.
// Without this, the file would be treated as a server-only component.

// ==================================================================
// Bird Component
// ==================================================================
export function Bird({ bird }) {
  /*
    WHAT IS THIS COMPONENT?
    -----------------------
    This component visually represents the bird in the Flappy Bird game.
    It draws a small yellow rectangle with a beak, eye, and wing.
    The bird is positioned dynamically based on its x (horizontal) and y (vertical) coordinates.
    It also rotates slightly depending on its velocity (so it tilts up/down as it moves).

    WHAT IS "bird"?
    ---------------
    "bird" is an object passed as props into this component.
    Example: bird = { x: 100, y: 200, velocity: 2 }
      - bird.x → how far from the left side of the game screen the bird is.
      - bird.y → how far from the top of the game screen the bird is.
      - bird.velocity → the bird’s speed; used here to tilt the bird with rotation.
  */

  return (
    <div
      style={{
        // CSS property: position absolute
        // This removes the element from the normal document flow
        // and places it at exact coordinates (left, top).
        // We need this because the bird moves freely inside the game area.
        position: "absolute",

        // Left = horizontal position of the bird.
        // We use bird.x so that the bird moves left/right.
        left: bird.x,

        // Top = vertical position of the bird.
        // We use bird.y so that the bird moves up/down.
        top: bird.y,

        // Size of the bird’s rectangular body.
        width: 40,
        height: 30,

        // Body color and border.
        backgroundColor: "yellow",     // bright yellow body
        border: "2px solid orange",    // orange outline
        borderRadius: "8px",           // rounded corners so the body looks softer

        // Tilt the bird slightly based on its velocity.
        // Math.min ensures the tilt never goes beyond 45 degrees.
        // This mimics how a bird angles upward/downward when flying.
        transform: `rotate(${Math.min(bird.velocity * 3, 45)}deg)`,
      }}
    >
      {/* Eye (a small black circle) */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",   // 50% makes a perfect circle
          backgroundColor: "black", // black circle
          position: "absolute",     // positioned relative to bird’s body
          top: 6,                   // y-offset from top of the bird body
          left: 25,                 // x-offset from left of the bird body
        }}
      />

      {/* Beak (a small orange triangle) */}
      <div
        style={{
          width: 10,
          height: 6,
          backgroundColor: "orange",   // beak is orange
          position: "absolute",
          top: 12,
          left: 38,
          // CSS trick: clipPath creates a triangle shape from a rectangle
          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
        }}
      />

      {/* Wing (a gold-colored small oval) */}
      <div
        style={{
          width: 14,
          height: 10,
          backgroundColor: "gold",
          borderRadius: "5px",        // rounded to make it look like a wing
          position: "absolute",
          top: 10,
          left: 5,
        }}
      />
    </div>
  );
}

// ==================================================================
// Pipe Component
// ==================================================================
export function Pipe({ pipe }) {
  /*
    WHAT IS THIS COMPONENT?
    -----------------------
    This component visually represents the "pipes" that the bird must fly through.
    Each pipe has two parts:
      - A top pipe that extends downward from the ceiling.
      - A bottom pipe that extends upward from the ground.
    Both pipes leave a gap between them for the bird to pass through.

    WHAT IS "pipe"?
    ---------------
    "pipe" is an object passed as props into this component.
    Example: pipe = { x: 300, topHeight: 150, bottomHeight: 200 }
      - pipe.x → how far from the left the pipe is positioned.
      - pipe.topHeight → height of the top pipe.
      - pipe.bottomHeight → height of the bottom pipe.
  */

  const PIPE_WIDTH = 60; // fixed width for all pipes

  return (
    <>
      {/* ------------------ TOP PIPE ------------------ */}
      <div
        /*
          Tailwind classes:
          -----------------
          absolute → position the pipe exactly with coordinates
          bg-green-600 → medium-dark green background color
          border-2 → 2px wide border
          border-green-800 → dark green border color
        */
        className="absolute bg-green-600 border-2 border-green-800"
        style={{
          left: pipe.x,          // horizontal position
          top: 0,                // pipe starts from top of screen
          width: PIPE_WIDTH,     // fixed width
          height: pipe.topHeight // dynamic height (passed from props)
        }}
      >
        {/* Pipe Rim (the thicker edge at the bottom of the top pipe) */}
        <div
          /*
            Tailwind classes:
            -----------------
            absolute → positioned inside the pipe
            bg-green-500 → slightly lighter green for rim
            border-t-4 → 4px border at the top
            border-green-700 → darker green border
          */
          className="absolute bg-green-500 border-t-4 border-green-700"
          style={{
            bottom: 0,                 // stick to bottom of top pipe
            left: -5,                  // extend a little to left for rim effect
            width: PIPE_WIDTH + 10,    // rim is wider than pipe
            height: 20,                // rim thickness
          }}
        />
      </div>

      {/* ------------------ BOTTOM PIPE ------------------ */}
      <div
        className="absolute bg-green-600 border-2 border-green-800"
        style={{
          left: pipe.x,                // same horizontal x as top pipe
          bottom: 0,                   // pipe grows from bottom upwards
          width: PIPE_WIDTH,
          height: pipe.bottomHeight,   // dynamic bottom pipe height
        }}
      >
        {/* Pipe Rim (the thicker edge at the top of the bottom pipe) */}
        <div
          className="absolute bg-green-500 border-b-4 border-green-700"
          style={{
            top: 0,                     // stick to top of bottom pipe
            left: -5,
            width: PIPE_WIDTH + 10,
            height: 20,
          }}
        />
      </div>
    </>
  );
}

// ==================================================================
// Scoreboard Component
// ==================================================================
export function ScoreBoard({ score, highScore }) {
  /*
    WHAT IS THIS COMPONENT?
    -----------------------
    The ScoreBoard displays the current score and the best score (high score).
    It stays fixed on the screen (doesn’t move with bird or pipes).
  */

  return (
    <>
      {/* Current Score (top-left corner of the screen) */}
      <div
        /*
          Tailwind classes:
          -----------------
          absolute → positioned in top-left corner
          top-4 left-4 → margin from top and left
          text-white → white text
          text-2xl → large font size
          font-bold → bold text
          bg-black bg-opacity-50 → semi-transparent black background
          px-3 py-1 → padding (space inside box)
          rounded → rounded corners
        */
        className="absolute top-4 left-4 text-white text-2xl font-bold bg-black bg-opacity-50 px-3 py-1 rounded"
      >
        {score}
      </div>

      {/* High Score (top-right corner of the screen) */}
      <div
        className="absolute top-4 right-4 text-white text-sm font-bold bg-black bg-opacity-50 px-2 py-1 rounded"
      >
        Best: {highScore}
      </div>
    </>
  );
}

// ==================================================================
// Overlay Component
// ==================================================================
export function Overlay({ type, children }) {
  /*
    WHAT IS THIS COMPONENT?
    -----------------------
    Overlay is used for displaying "Start Screen" or "Game Over Screen".
    It covers the entire game area with a semi-transparent background.

    WHAT IS "type"?
    ---------------
    "type" prop decides how dark the overlay should be.
      - type = "start" → lighter transparency
      - type = anything else (like "gameOver") → darker background
  */

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center text-white ${
        type === "start" ? "bg-black bg-opacity-50" : "bg-black bg-opacity-75"
      }`}

    >

      {children}
    </div>
  );
}
