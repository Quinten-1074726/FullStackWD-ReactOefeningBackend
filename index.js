import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Server is listening on port ${process.env.EXPRESS_PORT}`);
});
