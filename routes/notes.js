import express from "express";
import Note from "../models/Note.js";
import { faker } from "@faker-js/faker";

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

function toResponseNote(req, noteDoc) {
  const obj = noteDoc.toObject();

  obj.favorite = String(obj.favorite);

  obj._links = noteLinks(req, obj._id);
  return obj;
}

// OPTIONS /notes (collection)
router.options("/", (req, res) => {
  res.setHeader("Allow", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return res.sendStatus(204);
});

// OPTIONS /notes/:id (detail)
router.options("/:id", (req, res) => {
  res.setHeader("Allow", "GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  return res.sendStatus(204);
});

// GET /notes (collection)
router.get("/", async (req, res) => {
  const items = await Note.find().sort({ createdAt: -1 });

  const mappedItems = items.map((note) => toResponseNote(req, note));

  res.json({
    items: mappedItems,
    _links: {
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

  res.json(toResponseNote(req, note));
});

// POST /notes (create)
router.post("/", async (req, res) => {
  const { title, body, author, favorite } = req.body;

  if (!title || !body || !author) {
    return res.status(400).json({
      message: "title, body and author cannot be empty",
    });
  }

  const created = await Note.create({
    title,
    body,
    author,
    favorite: favorite === true || favorite === "true",
  });

  res.status(201).json(toResponseNote(req, created));
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

  res.json(toResponseNote(req, updated));
});

// DELETE /notes/:id
router.delete("/:id", async (req, res) => {
  const deleted = await Note.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: "Note not found" });
  }

  return res.sendStatus(204);
});

// POST /notes/seed 
router.post("/seed", async (req, res) => {
  try {
    // body params
    const amountRaw = req.body?.amount ?? 10;
    const resetRaw = req.body?.reset ?? false;

    const amount = Number(amountRaw) || 10;
    const reset = resetRaw === true || resetRaw === "true";

    if (reset) {
      await Note.deleteMany({});
    }

    const fakeNotes = Array.from({ length: amount }).map(() => ({
      title: faker.lorem.sentence(3),
      body: faker.lorem.paragraph(),
      author: faker.person.firstName(),
      favorite: faker.datatype.boolean(),
    }));

    const inserted = await Note.insertMany(fakeNotes);

    return res.status(201).json({
      message: "Database seeded",
      reset,
      count: inserted.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
