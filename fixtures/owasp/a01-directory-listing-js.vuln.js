import express from "express";
import serveIndex from "serve-index";

const app = express();
app.use("/files", express.static("uploads"), serveIndex("uploads", { icons: true }));
