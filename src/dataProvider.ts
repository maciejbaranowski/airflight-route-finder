import {Airport, Airports, DestinationsMap} from "./types"
import {KayakData, KayakScraper} from "./kayakScraper"
import fs from 'fs';

export default class Scraper {
  async trigger() {
    await this
      .kayakClient
      .launch();
    this.populateDestinationsFrom("WRO");
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
  }

  private populateDestinationsFrom = (from : string, depth : number = 0) => {
    if (depth > 0) {
      console.log(`Max depth reached! Returning`);
      return;
    }
    if (this.destinationsMap.has(from)) {
      console.log(`Data for ${from} already acquired`);
      return;
    }
    this
      .destinationsMap
      .set(from, []); //placeholder, so that other threads know, that this is alredy to be set
    console.log(`Getting data from ${from}`);
    this
      .kayakClient
      .getDestinations(from)
      .then((kayakData : KayakData) => {
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
        console.log(`Data loaded for ${from}`);
        kayakData
          .destinations
          .forEach((destination) => {
            this.populateDestinationsFrom(destination.airport, depth + 1);
          });
      });
  }

  private airports : Airports = new Array;
  private destinationsMap : DestinationsMap = new Map;
  private kayakClient = new KayakScraper;
};
