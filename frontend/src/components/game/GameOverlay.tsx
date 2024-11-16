import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

interface GameOverlayProps {
  isLevelUp: boolean;
  isBossLevel: boolean;
  level: number;
  onResume?: () => void;
  isPaused: boolean;
}

export const GameOverlay = ({
  isLevelUp,
  isBossLevel,
  level,
  onResume,
  isPaused,
}: GameOverlayProps) => {
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
    </>
  );
};
