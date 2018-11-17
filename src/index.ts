import express from "express"
import Scraper from "./scraper"
import {Airport, TravelDescriptions} from "./airportType"
import fs from "fs"
import travelAlgorithm from "./travelAlgorithm"
import { filterNoDomestic, filterTooMuch } from "./filters";

const app = express();
const port = 3000;

const scraper = new Scraper();

app.set("view engine", "pug");

app.get("/trigger/destinations", (req, res) => {
  try {
    scraper.trigger();
  } catch {
    console.log("Failure when scrapping, results so far should be still there");
  }
  res.send("Triggered!");
});

app.get("/trigger/airports", (req, res) => {
  let lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('./data/airports.csv')
  });

  let airports : {
    [index : string] : Airport
  } = {};

  lineReader.on('line', (line : string) => {
    let segments = line
      .replace(/"/g, "")
      .split(",");
    let airport : Airport = {
      code: segments[4],
      city: segments[2],
      country: segments[3],
      name: segments[1]
    }
    airports[segments[4]] = airport;
  });
  lineReader.on('close', () => {
    fs.writeFile('./data/airports.json', JSON.stringify(airports, null, 2), () => {});
  });
  res.send("Triggered");
})

app.get("/dump", (req, res) => {
  scraper.dumpToFile();
  res.send("File Dumped");
});



app.get("/travel", (req, res) => {
  const source = req.query.from;
  const length = parseInt(req.query.length);
  const filterOrigin = req.query.filterOrigin;
  fs.readFile("./data/destinations.json", (err, destinationsData) => {
    fs.readFile("./data/airports.json", (err, airportsData) => {
      let destinationsMap = JSON.parse(destinationsData.toString());
      let airports = JSON.parse(airportsData.toString());
      let travels = travelAlgorithm(destinationsMap, source, length);
      let travelsDescriptions : TravelDescriptions = travels.map((travel) => {
        return travel.map((destination) => {
          let airport = Object.assign({},airports[destination.airport]);
          airport = airport ? airport : {
            code: destination,
            country: "",
            city: "",
            name: "",
          };
          airport.getBy = destination.airline;
          return airport;
        });
      });
      if (filterOrigin) travelsDescriptions = filterNoDomestic(travelsDescriptions);
      travelsDescriptions = filterTooMuch(travelsDescriptions);
      res.render("travels", {travels: travelsDescriptions});
    });
  });
});

app.get("/", (req,res) => {
  fs.readFile("./data/airports.json", (err, airportsData) => {
    const airports = JSON.parse(airportsData.toString());
    res.render("index", {airports});
  });
});

app.listen(port, () => {
  console.log(`API Listening on port ${port}`);
});