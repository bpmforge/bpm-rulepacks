import express from "express";
import cors from "cors";

const ALLOWED_ORIGINS = ["https://app.example.com"];
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));

app.get("/api/data", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://app.example.com");
  res.json({ ok: true });
});
