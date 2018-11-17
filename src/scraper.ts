import puppeteer from 'puppeteer'

export default class Scraper {
  private _data : any = [];
  constructor() {
    console.log("Scraper initialized");
    this.scrap().then((value) => {
      this._data = value;
    });
  }
  get data() : any {
    return this._data;
  }
  async scrap() : Promise<any> {
    let url = "https://www.skyscanner.net";
    return new Promise<any>(async (resolve,reject) => {
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36');
      await page.setViewport({width: 1000, height: 1000})
      await page.goto(url);
      await page.waitFor(5000);
      let data = await page.evaluate(() => {
        return [1];//ddocument.querySelectorAll<HTMLSpanElement>(".Sorting-price")[0]!.innerText;
      })
      console.log(`Data: ${data}`);
      resolve(data);
    });
  }
};
