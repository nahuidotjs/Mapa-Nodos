export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

export interface GeoCentroid {
  lat: number;
  lng: number;
}

export enum ConnectionMode {
  STAR = 'STAR', // Connect all to centroid
  MESH = 'MESH', // Connect all to all
  PATH = 'PATH'  // Sequential path
}

export enum ConnectionStyle {
  ARC = 'ARC',         // Great circle (above surface)
  STRAIGHT = 'STRAIGHT' // Tunnel (through earth)
}

export enum MapStyle {
  DARK = 'DARK',
  STREET = 'STREET',      // Earth Day (Map-like)
  SATELLITE = 'SATELLITE', // Blue Marble
  BLUE = 'BLUE'
}

export interface DistanceStat {
  from: string;
  to: string;
  distanceKm: number;
}
