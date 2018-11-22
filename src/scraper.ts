import puppeteer from 'puppeteer'
import {Airport, Airports, Destination, Destinations, DestinationsMap} from "./airportType"
import fs from 'fs';

export default class Scraper {
  private airports : Airports = new Array;
  private destinationsMap : DestinationsMap = new Map;
  private browser : puppeteer.Browser | null = null;
  private runningPages : number = 0;
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
      .getListOfDestinationsFrom(from)
      .then((kayakData : KayakData) => {
        kayakData.airports.forEach((airport: Airport) => {
          if (this.airports.indexOf(airport) === -1) {
            this.airports.push(airport);
          }
        });
        this
          .destinationsMap
          .set(from, kayakData.destinations.filter((destination) => (destination.airline === "Ryanair" || destination.airline === "Wizzair")));
        console.log(`Data loaded for ${from}`);
        kayakData.destinations.forEach((destination) => {
          this.populateDestinationsFrom(destination.airport, depth + 1);
        });
      });
  }
  dumpToFile() {
    let dump : any = {};
    this
      .getDestinationsMap()
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
  trigger() {
    puppeteer
      .launch({headless: false/*, args: ['--proxy-server=88.199.21.75:80']*/})
      .then((browser) => {
        this.browser = browser;
        this.populateDestinationsFrom("WRO");
      });
  };
  getDestinationsMap() : DestinationsMap {return this.destinationsMap;}
  getListOfDestinationsFrom(airport : string) : Promise < KayakData > {
    return new Promise(async(resolve, reject) => {
      const blockedResourceTypes = [
        'image',
        'media',
        'font',
        'texttrack',
        'object',
        'beacon',
        'csp_report',
        'imageset'
      ];
      const skippedResources = [
        'quantserve',
        'adzerk',
        'doubleclick',
        'adition',
        'exelator',
        'sharethrough',
        'cdn.api.twitter',
        'google-analytics',
        'googletagmanager',
        'google',
        'fontawesome',
        'facebook',
        'analytics',
        'optimizely',
        'clicktale',
        'mixpanel',
        'zedo',
        'clicksor',
        'tiqcdn'
      ];

      let url = `https://www.kayak.pl/direct/${airport}/2018-12`;
      while (this.runningPages > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      this.runningPages += 1;
      const page = await this.browser !.newPage();
      await page.setRequestInterception(true);
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51' +
          '.0.2704.103 Safari/537.36');
      await page.setViewport({width: 1000, height: 1000});
      page.on('request', request => {
        const requestUrl = request
          .url()
          .split('?')[0]
          .split('#')[0];
        if (blockedResourceTypes.indexOf(request.resourceType()) !== -1 || skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      await page.goto(url, {
        timeout: 40000,
        waitUntil: 'networkidle2'
      });
      let scrappedData = await page.evaluate(() => {
        const getAirlineName = (airportHeader : HTMLDivElement) => {
          if (airportHeader.querySelectorAll("[title='Ryanair']").length > 0) 
            return "Ryanair";
          if (airportHeader.querySelectorAll("[title='Wizz Air']").length > 0) 
            return "Wizzair";
          return "Other";
        }
        return {
          destinations: Array
            .from(document.querySelectorAll < HTMLDivElement > (".airportHeader"))
            .map((element) => {
              const code = /\(([A-Z]{3,4})\)/.exec(element.querySelector < HTMLDivElement > (".airportname")!.innerText)![1];
              return {airport: code, airline: getAirlineName(element)};
            }),
          airports: Array
            .from(document.querySelectorAll < HTMLDivElement > (".airportHeader"))
            .map((element) => {
              const code = /\(([A-Z]{3,4})\)/.exec(element.querySelector < HTMLDivElement > (".airportname")!.innerText)![1];
              return {
                code: code,
                country: element.querySelector < HTMLDivElement > (".airportname")!
                  .innerText
                  .split(", ")[1]
                  .split(" - ")[0],
                city: element.querySelector < HTMLDivElement > (".airportname")!
                  .innerText
                  .split(",")[0],
                name: element.querySelector < HTMLDivElement > (".airportname")!
                  .innerText
                  .split(" - ")[1]
                  .split(" (")[0]
              };
            })
        }
      });
      page.close();
      this.runningPages -= 1;
      resolve(scrappedData);
    });
  }
};

type KayakData = {
  destinations: Destinations,
  airports: Airports
};

class KayakScraper {}