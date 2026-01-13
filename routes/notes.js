import express from "express";
import Note from "../models/Note.js";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

const router = express.Router();

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

// 6.1 OPTIONS: collection
router.options("/", (req, res) => {
  res.setHeader("Allow", "GET,POST,OPTIONS");
  return res.sendStatus(204);
});

// 6.1 OPTIONS: detail
router.options("/:id", (req, res) => {
  res.setHeader("Allow", "GET,PUT,DELETE,OPTIONS");
  return res.sendStatus(204);
});

// GET /notes (collection) + pagination
router.get("/", async (req, res) => {
  const baseUrl = getBaseUrl(req);

  const total = await Note.countDocuments();

  const hasLimit = req.query.limit !== undefined;

  // als limit NIET is meegegeven: alles teruggeven (1 pagina)
  const limit = hasLimit
    ? Math.max(1, Math.min(100, Number(req.query.limit) || 10))
    : (total === 0 ? 1 : total);

  const offset = hasLimit
    ? Math.max(0, Number(req.query.offset) || 0)
    : 0;

  const notes = await Note.find()
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const items = notes.map((n) => ({
    id: String(n._id),
    title: n.title,
    author: n.author,
    favorite: n.favorite,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    _links: {
      self: { href: `${baseUrl}/notes/${n._id}` },
      collection: { href: `${baseUrl}/notes` },
    },
  }));

  // page/pagecount: zonder limit -> altijd 1 pagina
  const page = hasLimit ? Math.floor(offset / limit) + 1 : 1;
  const pagecount = hasLimit
    ? Math.max(1, Math.ceil(total / limit))
    : 1;

  // self “pure” collection url (voor basic check)
  const links = {
    self: { href: `${baseUrl}/notes` },
    collection: { href: `${baseUrl}/notes` },
  };

  // extra links alleen als er gepagineerd wordt
  if (hasLimit) {
    links.current = { href: `${baseUrl}/notes?limit=${limit}&offset=${offset}` };

    const nextOffset = offset + limit;
    const prevOffset = offset - limit;

    if (nextOffset < total) {
      links.next = { href: `${baseUrl}/notes?limit=${limit}&offset=${nextOffset}` };
    }
    if (prevOffset >= 0) {
      links.prev = { href: `${baseUrl}/notes?limit=${limit}&offset=${prevOffset}` };
    }
  }

  res.json({
    items,
    count: items.length,
    pagination: {
      limit,
      offset,
      total,
      page,
      pagecount,   
      pageCount: pagecount, 
    },
    _links: links,
  });
});

// GET /notes/:id (detail)
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Note not found" });
  }

  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Note not found" });

  const baseUrl = getBaseUrl(req);

  res.json({
    id: String(note._id),
    title: note.title,
    body: note.body,
    author: note.author,
    favorite: note.favorite,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Note not found" });
  }

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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Note not found" });
  }

  const deleted = await Note.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Note not found" });

  return res.sendStatus(204); 
});

// POST /notes/seed (seed) — amount + reset
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
