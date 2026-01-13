import express from "express";
import { faker } from "@faker-js/faker";
import Note from "../models/Note.js";
import mongoose from "mongoose";

const router = express.Router();

// GET /notes (collection)
router.get("/", async (req, res) => {
  const items = await Note.find().sort({ createdAt: -1 });
  res.json({ items, count: items.length });
});

router.post("/seed", async (req, res) => {
  try {
    const fakeNotes = [];

    for (let i = 0; i < 10; i++) {
      fakeNotes.push({
        title: faker.lorem.sentence(3),
        body: faker.lorem.paragraph(),
        author: faker.person.firstName(),
        favorite: faker.datatype.boolean(),
      });
    }

    const insertedNotes = await Note.insertMany(fakeNotes);

    res.status(201).json({
      message: "Database seeded",
      count: insertedNotes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /notes/:id (detail)
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Note not found" });

  res.json(note);
});

// POST /notes (create)
router.post("/", async (req, res) => {
  const { title, body, author, favorite } = req.body;

  if (!title || !body || !author) {
    return res.status(400).json({
      message: "title, body and author cannot be empty",
    });
  }

  const newNote = await Note.create({
    title,
    body,
    author,
    favorite: favorite === true || favorite === "true",
  });

  res.status(201).json(newNote);
});

// PUT /notes/:id (update)
router.put("/:id", async (req, res) => {
  const { title, body, author, favorite } = req.body;

  if (!title || !body || !author) {
    return res.status(400).json({
      message: "title, body and author cannot be empty",
    });
  }

  const updated = await Note.findByIdAndUpdate(
    req.params.id,
    {
      title,
      body,
      author,
      favorite: favorite === true || favorite === "true",
    },
    { new: true } // return updated doc
  );

  if (!updated) {
    return res.status(404).json({ message: "Note not found" });
  }

  res.json(updated);
});

// DELETE /notes/:id
router.delete("/:id", async (req, res) => {
  const deleted = await Note.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: "Note not found" });
  }

  res.json({ message: "Deleted", item: deleted });
});



export default router;
