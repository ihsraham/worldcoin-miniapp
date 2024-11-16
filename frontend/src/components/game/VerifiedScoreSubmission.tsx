// components/game/VerifiedScoreSubmission.tsx
import {
  IDKitWidget,
  ISuccessResult,
  VerificationLevel,
} from "@worldcoin/idkit";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface VerifiedScoreSubmissionProps {
  score: number;
  previousHighScore: number;
  onSubmissionComplete: () => void;
}

export const VerifiedScoreSubmission = ({
  score,
  previousHighScore,
  onSubmissionComplete,
}: VerifiedScoreSubmissionProps) => {
  const handleVerify = async (proof: ISuccessResult) => {
    try {
      const response = await fetch("/api/verify-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          proof: proof.proof,
          verification_level: proof.verification_level,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify score");
      }

      localStorage.setItem(
        "verifiedHighScore",
        JSON.stringify({
          score,
          nullifierHash: proof.nullifier_hash,
          verificationLevel: proof.verification_level,
          timestamp: Date.now(),
        })
      );

      // Call onSubmissionComplete to trigger leaderboard display
      onSubmissionComplete();
    } catch (error) {
      console.error("Error verifying score:", error);
    }
  };

  const appId = "app_0b25c0e41ad700c4716ff0054420c269" as `app_${string}`;

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className="flex flex-col items-center gap-4">
              <span className="text-4xl">🏆</span>
              <span className="text-2xl text-yellow-400">New High Score!</span>
              <span className="text-lg text-gray-300">Score: {score}</span>
              <p className="text-sm text-gray-400 mb-4">
                Verify you're human to submit your score to the global
                leaderboard
              </p>
              <IDKitWidget
                app_id={appId}
                action="submit_high_score"
                onSuccess={() => {
                  console.log("Verification successful!");
                }}
                handleVerify={handleVerify}
                verification_level={VerificationLevel.Device}>
                {({ open }) => (
                  <Button
                    onClick={open}
                    size="lg"
                    className="bg-blue-500 hover:bg-blue-600 animate-pulse">
                    Verify & Submit Score
                  </Button>
                )}
              </IDKitWidget>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};
