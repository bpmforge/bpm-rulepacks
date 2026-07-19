import express from "express";

const app = express();
app.use("/files", requireAuth, express.static("uploads"));
