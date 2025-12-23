import axios from "axios";

// Fetcher mặc định cho GET requests
export const fetcher = async (url) => {
    const response = await axios.get(url);
    return response.data;
};

// Fetcher cho POST requests (dùng cho suggest API)
export const postFetcher = async ({ url, data }) => {
    const response = await axios.post(url, data);
    return response.data;
};