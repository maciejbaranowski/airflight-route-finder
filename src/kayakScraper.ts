import puppeteer, {Page} from 'puppeteer'
import {Airports, Destinations} from "./types"

export type KayakData = {
  destinations: Destinations,
  airports: Airports
};

export class KayakScraper {
  private configuration = {
    headless: false,
    browserArgs: [''],
    /*['--proxy-server=88.199.21.75:80']*/
    browserTimeout: 40000
  }

  async launch() {
    return new Promise((resolve, reject) => {
      puppeteer
        .launch({headless: this.configuration.headless, args: this.configuration.browserArgs})
        .then((browser) => {
          this.browser = browser;
          resolve();
        })
        .catch(reject);
    });
  };
  getDestinations(airport : string) : Promise < KayakData > {
    return new Promise(async(resolve, reject) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth();
      let url = `https://www.kayak.pl/direct/${airport}/${year}-${month}`;
      while (this.runningPages > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      this.runningPages += 1;
      try {
        let page = await this.browser!.newPage();
        page = await this.setupPage(page, url);
        let scrappedData = await page.evaluate(this.pageEvaluationOnClient);
        page.close();
        this.runningPages -= 1;
        resolve(scrappedData);
      } catch(e) {
        reject(`Running page failed, due to: ${e}`);
      }
    });
  }

  private pageEvaluationOnClient() : KayakData {
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
  }
  private async setupPage(page : Page, url : string) : Promise<Page> {
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
      timeout: this.configuration.browserTimeout,
      waitUntil: 'networkidle2'
    });
    return page;
  }

  private browser : puppeteer.Browser | null = null;
  private runningPages : number = 0;
}