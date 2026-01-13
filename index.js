import express from "express";
import mongoose from "mongoose";
import notesRouter from "./routes/notes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

// route for notes
app.use("/notes", notesRouter);

const PORT = process.env.EXPRESS_PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
