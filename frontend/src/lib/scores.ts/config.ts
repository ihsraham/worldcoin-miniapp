const isDev = import.meta.env.MODE === 'development';
export const API_BASE_URL = isDev 
  ? "http://localhost:3001"
  : "https://worldcoin-miniapp.vercel.app";
    