import { NextApiRequest, NextApiResponse } from 'next';
import { verifyCloudProof } from '@worldcoin/idkit';
import fs from 'fs';
import path from 'path';

// Define types for our score data
interface VerifiedScore {
  score: number;
  nullifierHash: string;
  verificationLevel: string;
  timestamp: string;
}

interface ScoresData {
  verifiedScores: VerifiedScore[];
}

const SCORES_FILE_PATH = path.join(process.cwd(), 'src/data/scores.json');

// Helper functions to read and write scores
const readScores = (): ScoresData => {
  try {
    const data = fs.readFileSync(SCORES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return default structure
    return { verifiedScores: [] };
  }
};

const writeScores = (data: ScoresData) => {
  fs.writeFileSync(SCORES_FILE_PATH, JSON.stringify(data, null, 2));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Add endpoint to get leaderboard
    const data = readScores();
    const sortedScores = data.verifiedScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Get top 10 scores
    return res.status(200).json(sortedScores);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { score, ...proof } = req.body;
    
    // Verify the World ID proof
    const verificationResponse = await verifyCloudProof(
      proof,
      'app_0b25c0e41ad700c4716ff0054420c269',
      'submit_high_score'
    );

    if (!verificationResponse.success) {
      return res.status(400).json({ error: 'Invalid proof' });
    }

    // Read existing scores
    const data = readScores();

    // Check if this nullifier hash has already been used
    const existingScore = data.verifiedScores.find(
      s => s.nullifierHash === proof.nullifier_hash
    );

    if (existingScore) {
      // Update the score if it's higher than the existing one
      if (score > existingScore.score) {
        existingScore.score = score;
        existingScore.timestamp = new Date().toISOString();
        writeScores(data);
      }
    } else {
      // Add new score
      const newScore: VerifiedScore = {
        score,
        nullifierHash: proof.nullifier_hash,
        verificationLevel: proof.verification_level,
        timestamp: new Date().toISOString(),
      };

      data.verifiedScores.push(newScore);
      writeScores(data);
    }

    // Get current leaderboard position
    const position = data.verifiedScores
      .sort((a, b) => b.score - a.score)
      .findIndex(s => s.nullifierHash === proof.nullifier_hash) + 1;

    return res.status(200).json({
      success: true,
      verifiedScore: score,
      nullifierHash: proof.nullifier_hash,
      leaderboardPosition: position
    });
  } catch (error) {
    console.error('Error verifying score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}