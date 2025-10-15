"use client";

import FlappyGame from "./game/FlappyGame";

export default function Page() {
  return <FlappyGame />;
}


// "use client";

// import { Bird, Pipe, ScoreBoard, Overlay } from "./game/GameObjects";

// export default function Page() {
//   return (
//         // <Bird bird={{ x: 100, y: 150, velocity: 2 }} />
//         // <Pipe pipe={{ x: 300, topHeight: 150, bottomHeight: 200 }} />
//         // <ScoreBoard score={10} highScore={20} />
//       //         <Overlay type="start">
//       //   <h1 className="text-3xl font-bold">Press Space to Start</h1>
//       // </Overlay>
//   );
// }
