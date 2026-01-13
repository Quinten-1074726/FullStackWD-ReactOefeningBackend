import express from "express";
import Note from "../models/Note.js";

const router = express.Router();

function baseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function noteLinks(req, id) {
  const base = baseUrl(req);
  return {
    self: { href: `${base}/notes/${id}` },
    collection: { href: `${base}/notes` },
  };
}

// GET /notes (collection)
router.get("/", async (req, res) => {
  const items = await Note.find().sort({ createdAt: -1 });

  res.json({
    items,
    links: {
      self: { href: `${baseUrl(req)}/notes` },
      collection: { href: `${baseUrl(req)}/notes` },
    },
  });
});

// GET /notes/:id (detail)
router.get("/:id", async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  // mongoose document plain object + links
  const obj = note.toObject();
  obj.links = noteLinks(req, note._id);

  res.json(obj);
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
    { new: true }
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
