import { GeoPoint, GeoCentroid } from '../types';
import * as THREE from 'three';

/**
 * Converts Degrees to Radians
 */
const toRad = (deg: number): number => deg * Math.PI / 180;

/**
 * Converts Radians to Degrees
 */
const toDeg = (rad: number): number => rad * 180 / Math.PI;

/**
 * Calculates the geographic midpoint (centroid) of multiple lat/lng points.
 * This involves converting spherical coordinates to Cartesian (x,y,z), 
 * averaging them, and converting back.
 */
export const calculateCentroid = (points: GeoPoint[]): GeoCentroid | null => {
  if (points.length === 0) return null;
  if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng };

  let x = 0;
  let y = 0;
  let z = 0;

  points.forEach(p => {
    const latRad = toRad(p.lat);
    const lngRad = toRad(p.lng);

    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  });

  const total = points.length;
  x = x / total;
  y = y / total;
  z = z / total;

  const centralLng = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const centralLat = Math.atan2(z, hyp);

  return {
    lat: toDeg(centralLat),
    lng: toDeg(centralLng)
  };
};

/**
 * Calculates the Great Circle distance between two points in Kilometers
 */
export const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Converts Lat/Lng to 3D Cartesian Coordinates (Vector3)
 * Default Globe Radius in react-globe.gl is 100
 */
export const toCartesianVector = (lat: number, lng: number, radius: number = 100): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
};