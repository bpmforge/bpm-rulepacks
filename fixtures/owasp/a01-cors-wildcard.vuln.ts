import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));

app.get("/api/data", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({ ok: true });
});
