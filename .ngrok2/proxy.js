const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Proxy สำหรับ API (port 5000)
app.use("/api", createProxyMiddleware({
  target: "http://localhost:5000",
  changeOrigin: true,
  pathRewrite: { "^/api": "" }
}));

// Proxy สำหรับโมเดล (port 8000)
app.use("/model", createProxyMiddleware({
  target: "http://localhost:8000",
  changeOrigin: true,
  pathRewrite: { "^/model": "" }
}));

// Proxy สำหรับ frontend (React ที่ port 3000)
app.use("/", createProxyMiddleware({
  target: "http://localhost:3000",
  changeOrigin: true
}));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
