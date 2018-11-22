export interface Airport {
  code: string,
  city: string,
  country: string,
  name: string
};

export type Airports = Array<Airport>;
export type Destination = {
  airport : string,
  airline : string
}
export type Destinations = Array<Destination>;
export type DestinationsMap = Map<string, Destinations>;

export type TravelDescriptions = Array<Array<{
  code: string,
  country: string,
  city: string,
  name: string,
  getBy: string,
}>>;