// API Configuration
// Automatically detects the correct API URL based on where the frontend is accessed from
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Otherwise, use the same host as the frontend but port 5001
  const hostname = window.location.hostname;
  return `http://${hostname}:5001`;
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
