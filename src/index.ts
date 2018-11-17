import express from "express"
import Scraper from "./scraper"

const app = express();
const port = 3000;
const scraper = new Scraper();

app.get("/", (req, res) => {
  res.send(scraper.data);
});

app.listen(port, () => {
  console.log(`API Listening on port ${port}`);
});