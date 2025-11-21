import React, { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { GeoPoint, GeoCentroid, ConnectionMode, ConnectionStyle, MapStyle } from '../types';
import { toCartesianVector } from '../utils/geoUtils';

interface GlobeViewerProps {
  points: GeoPoint[];
  centroid: GeoCentroid | null;
  mode: ConnectionMode;
  connectionStyle: ConnectionStyle;
  globeOpacity: number;
  mapStyle: MapStyle;
  showBorders: boolean;
}

export interface GlobeHandle {
  zoomIn: () => void;
  zoomOut: () => void;
}

const GlobeViewer = forwardRef<GlobeHandle, GlobeViewerProps>(({ 
  points, 
  centroid, 
  mode, 
  connectionStyle, 
  globeOpacity,
  mapStyle,
  showBorders
}, ref) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [globeTexture, setGlobeTexture] = useState<THREE.Texture | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  
  // Track altitude for dynamic scaling of elements
  const [altitude, setAltitude] = useState(2.5);

  // Expose Zoom methods to parent
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (!globeEl.current) return;
      const currentAlt = globeEl.current.pointOfView().altitude;
      globeEl.current.pointOfView({ altitude: Math.max(0.05, currentAlt * 0.6) }, 400);
    },
    zoomOut: () => {
      if (!globeEl.current) return;
      const currentAlt = globeEl.current.pointOfView().altitude;
      globeEl.current.pointOfView({ altitude: Math.min(10, currentAlt * 1.4) }, 400);
    }
  }));

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load Borders (GeoJSON)
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Failed to load borders", err));
  }, []);

  // Load Texture based on MapStyle
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let url = '';
    
    if (mapStyle === MapStyle.STREET) {
      url = 'https://unpkg.com/three-globe/example/img/earth-day.jpg';
    } else if (mapStyle === MapStyle.SATELLITE) {
      url = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    }

    if (url) {
      loader.load(url, (texture) => {
        setGlobeTexture(texture);
      });
    } else {
      setGlobeTexture(null);
    }
  }, [mapStyle]);

  // Determine Atmosphere Color
  const atmosphereColor = useMemo(() => {
    switch (mapStyle) {
      case MapStyle.STREET: return '#ffffff';
      case MapStyle.SATELLITE: return '#3a228a';
      case MapStyle.BLUE: return '#60a5fa';
      default: return '#3a228a';
    }
  }, [mapStyle]);

  // Create dynamic globe material
  const globeMaterial = useMemo(() => {
    const baseColor = mapStyle === MapStyle.BLUE ? '#1e3a8a' : (mapStyle === MapStyle.DARK ? '#050505' : '#ffffff');
    
    return new THREE.MeshPhongMaterial({
      color: baseColor, 
      map: globeTexture,
      transparent: true,
      opacity: globeOpacity, 
      side: THREE.DoubleSide,
      shininess: mapStyle === MapStyle.DARK ? 30 : 10,
    });
  }, [globeOpacity, mapStyle, globeTexture]);

  // Generate connections data
  const connections = useMemo(() => {
    const items: any[] = [];

    if (mode === ConnectionMode.STAR && centroid && points.length > 0) {
      points.forEach(p => {
        items.push({
          startLat: p.lat,
          startLng: p.lng,
          endLat: centroid.lat,
          endLng: centroid.lng,
          color: p.color,
          secondaryColor: '#00ffff',
        });
      });
    } else if (mode === ConnectionMode.MESH) {
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          items.push({
            startLat: points[i].lat,
            startLng: points[i].lng,
            endLat: points[j].lat,
            endLng: points[j].lng,
            color: points[i].color,
            secondaryColor: points[j].color,
          });
        }
      }
    } else if (mode === ConnectionMode.PATH && points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        items.push({
          startLat: points[i].lat,
          startLng: points[i].lng,
          endLat: points[i+1].lat,
          endLng: points[i+1].lng,
          color: points[i].color,
          secondaryColor: points[i+1].color,
        });
      }
    }
    return items;
  }, [points, centroid, mode]);

  // Calculate dynamic scaling factor based on altitude
  // Base altitude is roughly 2.5. We want items smaller as we zoom in (altitude < 1)
  const zoomScale = Math.max(0.1, Math.min(1.5, altitude / 2.0));

  return (
    <div className="cursor-move">
      <Globe
        ref={globeEl}
        width={windowSize.width}
        height={windowSize.height}
        backgroundColor="#000000"
        
        onZoom={(pov) => setAltitude(pov.altitude)}

        // Visuals
        globeMaterial={globeMaterial}
        showAtmosphere={true}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={0.15}

        // --- BORDERS / CONTOURS ---
        polygonsData={showBorders ? geoJsonData?.features || [] : []}
        polygonCapColor={() => 'rgba(0,0,0,0)'} // Transparent fill
        polygonSideColor={() => 'rgba(0,0,0,0)'} 
        polygonStrokeColor={() => mapStyle === MapStyle.STREET ? '#444444' : 'rgba(255,255,255,0.4)'}
        polygonAltitude={0.005} // Slightly above surface

        // --- ARC DATA ---
        arcsData={connectionStyle === ConnectionStyle.ARC ? connections : []}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(d: any) => [d.color, d.secondaryColor]}
        arcDashLength={mode === ConnectionMode.MESH ? 1 : 0.5}
        arcDashGap={mode === ConnectionMode.MESH ? 0 : 0.2}
        arcDashAnimateTime={2000}
        arcStroke={1.5 * zoomScale} // Scale arc width
        arcAltitude={0.25}

        // --- CUSTOM LAYER (Straight Tunnels) ---
        customLayerData={connectionStyle === ConnectionStyle.STRAIGHT ? connections : []}
        customThreeObject={(d: any) => {
          const start = toCartesianVector(d.startLat, d.startLng);
          const end = toCartesianVector(d.endLat, d.endLng);
          const pointsArr = [start, end];
          const geometry = new THREE.BufferGeometry().setFromPoints(pointsArr);
          const material = new THREE.LineBasicMaterial({ 
            color: new THREE.Color(d.color).lerp(new THREE.Color(d.secondaryColor), 0.5),
            transparent: true,
            opacity: 0.8,
            linewidth: 1
          });
          return new THREE.Line(geometry, material);
        }}
        customLayerLabel="tunnels"
        
        // Labels
        labelsData={[
          ...points.map(p => ({
            lat: p.lat,
            lng: p.lng,
            text: p.name,
            color: p.color,
            size: 1.5
          })),
          ...(centroid ? [{
            lat: centroid.lat,
            lng: centroid.lng,
            text: "CENTER",
            color: "#00ffff",
            size: 2.0
          }] : [])
        ]}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelColor="color"
        labelSize={(d: any) => d.size * zoomScale} // Scale text size
        labelDotRadius={(d: any) => 0.8 * zoomScale} // Scale dot size
        
        // Rings
        ringsData={[
          ...points.map(p => ({
            lat: p.lat,
            lng: p.lng,
            color: p.color,
            maxR: 5,
            propagationSpeed: 2,
            repeatPeriod: 1000
          })),
          ...(centroid ? [{
            lat: centroid.lat,
            lng: centroid.lng,
            color: "#00ffff",
            maxR: 8,
            propagationSpeed: 4,
            repeatPeriod: 800
          }] : [])
        ]}
        ringColor="color"
        ringMaxRadius={(d: any) => d.maxR * zoomScale} // Scale max radius
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
});

export default GlobeViewer;