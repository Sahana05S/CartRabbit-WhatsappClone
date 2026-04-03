const GIPHY_BASE_URL = 'https://api.giphy.com/v1';
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const fetchGiphy = async (endpoint, params = {}) => {
  if (!API_KEY) {
    console.warn('GIPHY API Key is missing. Please check your .env file.');
    return { data: [] };
  }

  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    limit: 24,
    rating: 'g',
    ...params,
  });

  try {
    const response = await fetch(`${GIPHY_BASE_URL}${endpoint}?${queryParams}`);
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Giphy API Error:', err);
    return { data: [] };
  }
};

export const searchGifs = (q) => fetchGiphy('/gifs/search', { q });
export const trendingGifs = () => fetchGiphy('/gifs/trending');
export const searchStickers = (q) => fetchGiphy('/stickers/search', { q });
export const trendingStickers = () => fetchGiphy('/stickers/trending');
