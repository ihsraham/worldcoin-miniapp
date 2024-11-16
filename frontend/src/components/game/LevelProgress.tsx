import { Progress } from "../ui/progress";

interface LevelProgressProps {
  progress: number;
  isBossLevel: boolean;
}

export const LevelProgress = ({
  progress,
  isBossLevel,
}: LevelProgressProps) => {
  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-blue-300">
          {isBossLevel ? "Boss Health" : "Level Progress"}
        </span>
        <span className="text-sm text-blue-300">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
};

