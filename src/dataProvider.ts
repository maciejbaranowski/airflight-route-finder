import {Airport, Airports, DestinationsMap} from "./types"
import {KayakData, KayakScraper} from "./kayakScraper"
import fs from 'fs';

const INITIAL_DESTINATION = "WRO";
const MAX_DEPTH = 3;

export default class DataProvider {
  async trigger() {
    this
      .kayakClient
      .launch()
      .then(() => {
        this.requestsQueueLength = 0;
        this.populateDestinationsFrom(INITIAL_DESTINATION);
      })
      .catch(console.log);
  };

  dumpToFile() {
    let dump : any = {};
    this
      .destinationsMap
      .forEach((value, key) => {
        dump[key] = value;
      })
    fs.writeFile('./data/destinations.json', JSON.stringify(dump, null, 2), () => {});
    const airportsDump : any = {};
    this
      .airports
      .forEach((airport) => {
        airportsDump[airport.code] = airport;
      })
    fs.writeFile('./data/airports.json', JSON.stringify(airportsDump, null, 2), () => {});
    console.log("Files written");
  }

  private populateDestinationsFrom = (from : string, depth : number = 0) => {
    if (depth > MAX_DEPTH) {
      console.log(`Max depth reached! Still ${this.requestsQueueLength} requests to finish`);
      if (this.requestsQueueLength === 1) {
        this.requestsQueueLength = 0;
        this.dumpToFile();
      }
      return;
    }
    if (this.destinationsMap.has(from)) {
      console.log(`Data for ${from} already acquired`);
      return;
    }
    this
      .destinationsMap
      .set(from, []); //placeholder, so that other threads know, that this is alredy to be set
    this.requestsQueueLength += 1;

    console.log(`Getting data from ${from}`);
    this
      .kayakClient
      .getDestinations(from)
      .then(kayakData => {
        kayakData
          .airports
          .forEach((airport : Airport) => {
            if (this.airports.indexOf(airport) === -1) {
              this
                .airports
                .push(airport);
            }
          });
        this
          .destinationsMap
          .set(from, kayakData.destinations.filter((destination) => (destination.airline === "Ryanair" || destination.airline === "Wizzair")));
        kayakData
          .destinations
          .forEach((destination) => {
            this.populateDestinationsFrom(destination.airport, depth + 1);
          });
        console.log(`Data loaded for ${from}`);
        this.requestsQueueLength -= 1;
      })
      .catch((e) => {
        console.log(e);
        this.requestsQueueLength -= 1;
      })
  }

  private airports : Airports = new Array;
  private destinationsMap : DestinationsMap = new Map;
  private kayakClient = new KayakScraper;
  private requestsQueueLength = 0;
};
