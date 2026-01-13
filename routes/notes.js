import express from "express";
import Note from "../models/Note.js";
import { faker } from "@faker-js/faker";

const router = express.Router();

function getBaseUrl(req) {
  // Works locally + VPS (host bevat ook poort)
  return `${req.protocol}://${req.get("host")}`;
}

// GET /notes (collection)
router.get("/", async (req, res) => {
  const items = await Note.find().sort({ createdAt: -1 });

  const baseUrl = getBaseUrl(req);

  res.json({
    items: items.map((n) => ({
      ...n.toObject(),
      _links: {
        self: { href: `${baseUrl}/notes/${n._id}` },
        collection: { href: `${baseUrl}/notes` },
      },
    })),
    count: items.length,
    _links: {
      self: { href: `${baseUrl}/notes` },
      collection: { href: `${baseUrl}/notes` },
    },
  });
});

// GET /notes/:id (detail)
router.get("/:id", async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Note not found" });

  const baseUrl = getBaseUrl(req);

  res.json({
    ...note.toObject(),
    _links: {
      self: { href: `${baseUrl}/notes/${note._id}` },
      collection: { href: `${baseUrl}/notes` },
    },
  });
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

  const baseUrl = getBaseUrl(req);

  res.status(201).json({
    ...newNote.toObject(),
    _links: {
      self: { href: `${baseUrl}/notes/${newNote._id}` },
      collection: { href: `${baseUrl}/notes` },
    },
  });
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

  if (!updated) return res.status(404).json({ message: "Note not found" });

  const baseUrl = getBaseUrl(req);

  res.json({
    ...updated.toObject(),
    _links: {
      self: { href: `${baseUrl}/notes/${updated._id}` },
      collection: { href: `${baseUrl}/notes` },
    },
  });
});

// DELETE /notes/:id
router.delete("/:id", async (req, res) => {
  const deleted = await Note.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Note not found" });

  res.json({ message: "Deleted", item: deleted });
});

// POST /notes/seed (seed) — met amount + reset (5.2)
router.post("/seed", async (req, res) => {
  try {
    const amount = Number(req.body?.amount ?? 10);
    const reset = String(req.body?.reset ?? "false") === "true";

    if (reset) await Note.deleteMany({});

    const fakeNotes = Array.from({ length: amount }).map(() => ({
      title: faker.lorem.sentence(3),
      body: faker.lorem.paragraph(),
      author: faker.person.firstName(),
      favorite: faker.datatype.boolean(),
    }));

    const inserted = await Note.insertMany(fakeNotes);

    res.status(201).json({
      message: "Database seeded",
      reset,
      count: inserted.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
