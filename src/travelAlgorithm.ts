import { Airport, DestinationsMap, Destinations } from "./airportType";

export default (destinationsMap : {[index : string] : Destinations}, source: string, length : number) : Array<Destinations> => {
  let output : Array<Destinations> = [];
  let recurse = (from : string, travel : Destinations, depth : number = 0) => {
    if (destinationsMap[from] === undefined) return;
    for (let destination of destinationsMap[from]!) {
      if (depth > length) return;
      if (destination.airport === source) {
        if (depth === length) {
          let newTravel = travel.slice();
          newTravel.push(destination);
          output.push(newTravel);
        }
        return;
      }
      if (travel.indexOf(destination) != -1) {
        return;
      }
      let newTravel = travel.slice();
      newTravel.push(destination);
      recurse(destination.airport, newTravel, depth + 1);
    }
  }

  recurse(source,[{airport:source, airline:"-"}],0);
  return output;
}
