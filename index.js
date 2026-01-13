import express from "express";
import mongoose from "mongoose";
import notesRouter from "./routes/notes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6.1 Accept: application/json afdwingenOPTIONS  doorlaten
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const accept = req.headers.accept;

  // geen Accept header laat toe
  if (!accept) return next();

  // accepteert json of alles ok
  if (accept.includes("application/json") || accept.includes("*/*")) return next();

  return res.status(406).json({
    message:
      "Only application/json responses are supported. Send Accept: application/json",
  });
});

app.use("/notes", notesRouter);

const PORT = process.env.EXPRESS_PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
