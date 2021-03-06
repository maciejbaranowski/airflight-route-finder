import express from "express"
import DataProvider from "./dataProvider"
import {TravelDescriptions} from "./types"
import fs from "fs"
import travelAlgorithm from "./travelAlgorithm"
import {filterNoDomestic, filterTooMuch, filterAirline} from "./filters";

const app = express();
const port = process.env.PORT || 3000;

const dataProvider = new DataProvider();

app.set("view engine", "pug");

app.get("/trigger", (req, res) => {
  dataProvider
    .trigger()
    .then(() => {
      res.send("Triggered!");
    })
    .catch(res.send);
});

app.get("/dump", (req, res) => {
  dataProvider.dumpToFile();
  res.send("File Dumped");
});

app.get("/travel", (req, res) => {
  const source = req.query.from;
  const length = parseInt(req.query.length);
  const filterOrigin = req.query.filterOrigin;
  const includeRyanAir = req.query.ryanAirCheckBox;
  const includeWizzAir = req.query.wizzAirCheckBox;
  fs.readFile("./data/destinations.json", (err, destinationsData) => {
    fs.readFile("./data/airports.json", (err, airportsData) => {
      let destinationsMap = JSON.parse(destinationsData.toString());
      let airports = JSON.parse(airportsData.toString());
      let travels = travelAlgorithm(destinationsMap, source, length);
      let travelsDescriptions : TravelDescriptions = travels.map((travel) => {
        return travel.map((destination) => {
          let airport = Object.assign({}, airports[destination.airport]);
          airport = airport
            ? airport
            : {
              code: destination,
              country: "",
              city: "",
              name: ""
            };
          airport.airline = destination.airline;
          return airport;
        });
      });
      if (filterOrigin) 
        travelsDescriptions = filterNoDomestic(travelsDescriptions);
      if (!includeRyanAir) {
        travelsDescriptions = filterAirline(travelsDescriptions, "Ryanair")
      }
      if (!includeWizzAir) {
        travelsDescriptions = filterAirline(travelsDescriptions, "Wizzair")
      }
      travelsDescriptions = filterTooMuch(travelsDescriptions);
      res.render("travels", {travels: travelsDescriptions});
    });
  });
});

app.get("/", (req, res) => {
  fs.readFile("./data/airports.json", (err, airportsData) => {
    const airports = JSON.parse(airportsData.toString());
    res.render("index", {airports});
  });
});

app.listen(port, () => {
  console.log(`API Listening on port ${port}`);
});