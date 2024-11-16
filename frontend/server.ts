import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { verifyCloudProof } from '@worldcoin/idkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// CORS configuration
const allowedOrigins = [
  'https://worldcoin-miniapp.vercel.app',
  'http://localhost:5173', // For local development
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Use Vercel's temp directory for storage
const SCORES_FILE_PATH = process.env.VERCEL 
  ? '/tmp/scores.json'
  : path.join(__dirname, 'src/data/scores.json');

// Initialize scores file if it doesn't exist
if (!fs.existsSync(SCORES_FILE_PATH)) {
  fs.writeFileSync(SCORES_FILE_PATH, JSON.stringify({ verifiedScores: [] }));
}

// Helper functions
const readScores = () => {
  try {
    const data = fs.readFileSync(SCORES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { verifiedScores: [] };
  }
};

const writeScores = (data) => {
  fs.writeFileSync(SCORES_FILE_PATH, JSON.stringify(data, null, 2));
};

// Routes
app.get('/api/verify-score', (req, res) => {
  const data = readScores();
  const sortedScores = data.verifiedScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(sortedScores);
});

app.post('/api/verify-score', async (req, res) => {
  try {
    const { score, ...proof } = req.body;
    
    const verificationResponse = await verifyCloudProof(
      proof,
      'app_0b25c0e41ad700c4716ff0054420c269',
      'submit_high_score'
    );

    if (!verificationResponse.success) {
      return res.status(400).json({ error: 'Invalid proof' });
    }

    const data = readScores();
    const existingScore = data.verifiedScores.find(
      s => s.nullifierHash === proof.nullifier_hash
    );

    if (existingScore) {
      if (score > existingScore.score) {
        existingScore.score = score;
        existingScore.timestamp = new Date().toISOString();
        writeScores(data);
      }
    } else {
      data.verifiedScores.push({
        score,
        nullifierHash: proof.nullifier_hash,
        verificationLevel: proof.verification_level,
        timestamp: new Date().toISOString(),
      });
      writeScores(data);
    }

    const position = data.verifiedScores
      .sort((a, b) => b.score - a.score)
      .findIndex(s => s.nullifierHash === proof.nullifier_hash) + 1;

    res.json({
      success: true,
      verifiedScore: score,
      nullifierHash: proof.nullifier_hash,
      leaderboardPosition: position
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}