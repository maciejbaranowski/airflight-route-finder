import { TravelDescriptions } from "./airportType";
import travelAlgorithm from "./travelAlgorithm";

export const filterAirline = (travelDescriptions: TravelDescriptions, airline: string) => {
  return travelDescriptions.filter((travel) => {
    return travel.every((destination) => {
      return destination.getBy === airline;
    })
  })
}

export const filterNoDomestic = (travelDescriptions: TravelDescriptions) => {
  if (travelDescriptions.length === 0) return travelDescriptions;
  const originCountry = travelDescriptions[0][0].country;
  return travelDescriptions.filter((travel) => {
    return travel.slice(1,-1).every((destination) => {
      return destination.country != originCountry;
    })
  })
}

export const filterTooMuch = (travelDescriptions: TravelDescriptions) => {
  return travelDescriptions.slice(0,200);
}