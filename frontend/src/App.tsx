import { useEffect, useRef } from "react";
import { initializeGame } from "./Game";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      initializeGame(canvasRef.current);
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black">
      <h1 className="text-white text-3xl font-bold">Space Invaders</h1>
      <canvas
        ref={canvasRef}
        width="800"
        height="600"
        className="border-2 border-gray-500"
      />
      <div id="level-up" className="text-white text-xl mt-4 hidden">
        Level 1!
      </div>
      <div className="text-white mt-4">
        <p id="score">Score: 0</p>
        <p id="level">Level: 1</p>
      </div>
    </main>
  );
}
