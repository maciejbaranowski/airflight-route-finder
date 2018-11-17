export interface Airport {
  code: string,
  city: string,
  country: string,
  name: string
};

export type AirportList = Array<Airport>;
export type Destination = {
  airport : string,
  airline : string
}
export type Destinations = Array<Destination>;
export type DestinationsMap = Map<string, Destinations>;