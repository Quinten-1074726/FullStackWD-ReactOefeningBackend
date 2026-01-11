import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.get("/notes", (req, res) => {
  res.json({
    items: notes,
    count: notes.length,
  });
});

app.get("/notes/:id", (req, res) => {
  const noteId = req.params.id;

  const note = notes.find((n) => n.id === noteId);

  if (!note) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  res.json(note);
});


app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Server is listening on port ${process.env.EXPRESS_PORT}`);
});

const notes = [
  {
    id: "1",
    title: "Eerste note",
    body: "1e note ouwe",
    author: "Quinten",
    favorite: false,
  },
  {
    id: "2",
    title: "Tweede note",
    body: "Nog een note",
    author: "Quinten",
    favorite: true,
  },
];
