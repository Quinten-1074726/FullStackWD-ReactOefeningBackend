import express from "express";
import mongoose from "mongoose";
import notesRouter from "./routes/notes.js";

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers 
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  next();
});

app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const accept = req.headers.accept;

  // doorgaan zondre accept header
  if (!accept) return next();

  if (accept.includes("application/json") || accept.includes("*/*")) {
    return next();
  }

  return res.status(406).json({
    message:
      "Only application/json responses are supported. Send Accept: application/json",
  });
});

// Global OPTIONS 
app.options("*", (req, res) => {
  res.setHeader("Allow", "GET,POST,PUT,DELETE,OPTIONS");
  return res.sendStatus(204);
});

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

// Routes
app.use("/notes", notesRouter);

// DB + server start
const PORT = process.env.EXPRESS_PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
