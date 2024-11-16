import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface LeaderboardScore {
  score: number;
  timestamp: string;
  verificationLevel: string;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

export const Leaderboard = ({
  isOpen,
  onClose,
  currentScore,
}: LeaderboardProps) => {
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch("/api/verify-score");
        const data = await response.json();
        setScores(data);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchScores();
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className="flex flex-col items-center gap-4">
              <span className="text-4xl">🏆</span>
              <span className="text-2xl text-yellow-400">
                Global Leaderboard
              </span>
              {isLoading ? (
                <div className="animate-pulse">Loading scores...</div>
              ) : (
                <div className="w-full max-h-64 overflow-y-auto">
                  {scores.map((score, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-2 ${
                        currentScore === score.score ? "bg-blue-500/20" : ""
                      }`}>
                      <span className="text-lg">#{index + 1}</span>
                      <span className="text-xl font-bold">{score.score}</span>
                      <span className="text-sm opacity-50">
                        {new Date(score.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};
