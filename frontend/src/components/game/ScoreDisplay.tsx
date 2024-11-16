
import { Trophy, Star, Zap } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  highScore: number;
  level: number;
}

export const ScoreDisplay = ({
  score,
  highScore,
  level,
}: ScoreDisplayProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 p-4 bg-blue-950/50 rounded-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-500 h-5 w-5" />
        <span className="text-white font-bold">
          {highScore.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Star className="text-yellow-500 h-5 w-5" />
        <span className="text-white font-bold">{score.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="text-yellow-500 h-5 w-5" />
        <span className="text-white font-bold">Level {level}</span>
      </div>
    </div>
  );
};

    