import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { VerifiedScoreSubmission } from "./VerifiedScoreSubmission";
import { Leaderboard } from "./Leaderboard";

interface GameOverlayProps {
  isLevelUp: boolean;
  isBossLevel: boolean;
  level: number;
  onResume: () => void;
  isPaused: boolean;
  isGameOver: boolean;
  onRestart: () => void;
  finalScore: number;
  highScore: number;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  isLevelUp,
  isBossLevel,
  level,
  onResume,
  isPaused,
  isGameOver,
  onRestart,
  finalScore,
  highScore,
}) => {
  // Move hooks inside the component
  const [showVerification, setShowVerification] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (isGameOver && finalScore > highScore) {
      setShowVerification(true);
    }
  }, [isGameOver, finalScore, highScore]);

  const handleSubmissionComplete = () => {
    setShowVerification(false);
    setShowLeaderboard(true);
  };

  return (
    <>
      <AlertDialog open={isLevelUp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex flex-col items-center gap-4">
                {isBossLevel ? (
                  <>
                    <span className="text-4xl">🚨</span>
                    <span className="text-2xl text-red-500">BOSS LEVEL!</span>
                    <span className="text-4xl">🚨</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">🎮</span>
                    <span className="text-2xl text-blue-400">
                      Level {level} Complete!
                    </span>
                    <span className="text-4xl">⭐</span>
                  </>
                )}
              </div>
            </AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {isPaused && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Paused</h2>
            <Button onClick={onResume} size="lg" className="animate-pulse">
              Resume Game
            </Button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center bg-gray-900 p-8 rounded-lg border-2 border-red-500">
            <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-xl text-gray-300 mb-4">
              Final Score: {finalScore}
            </p>
            {finalScore === highScore && !showVerification && (
              <p className="text-lg text-yellow-400 mb-4">New High Score!</p>
            )}
            <Button
              onClick={onRestart}
              size="lg"
              className="animate-pulse bg-red-500 hover:bg-red-600">
              Play Again
            </Button>
          </div>
        </div>
      )}

      {showVerification && (
        <VerifiedScoreSubmission
          score={finalScore}
          onSubmissionComplete={handleSubmissionComplete}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          isOpen={true}
          onClose={() => {
            setShowLeaderboard(false);
          }}
          currentScore={finalScore}
        />
      )}
    </>
  );
};
