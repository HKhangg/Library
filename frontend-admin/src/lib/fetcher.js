import axios from "axios";

/**
 * Fetcher function cho SWR - GET requests
 * @param {string} url - API endpoint URL
 * @returns {Promise} - Response data
 */
export const fetcher = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

/**
 * Fetcher function cho SWR - POST requests
 * @param {string} url - API endpoint URL
 * @param {object} data - Request body data
 * @returns {Promise} - Response data
 */
export const postFetcher = async (url, data) => {
  const response = await axios.post(url, data);
  return response.data;
};
