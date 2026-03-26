import axios from "axios";

// ✅ Base URL (EC2 backend)
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://13.221.93.23:5000",
});

// ✅ Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
