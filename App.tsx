import React, { useState, useEffect, useMemo, useRef } from 'react';
import GlobeViewer, { GlobeHandle } from './components/GlobeViewer';
import OverlayUI from './components/OverlayUI';
import { parseLocation } from './services/geminiService';
import { calculateCentroid } from './utils/geoUtils';
import { GeoPoint, GeoCentroid, ConnectionMode, ConnectionStyle, MapStyle } from './types';

// Distinct colors for points
const COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
];

const App: React.FC = () => {
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const globeRef = useRef<GlobeHandle>(null);
  
  // State for visualization settings
  const [mode, setMode] = useState<ConnectionMode>(ConnectionMode.STAR);
  const [connectionStyle, setConnectionStyle] = useState<ConnectionStyle>(ConnectionStyle.ARC);
  const [mapStyle, setMapStyle] = useState<MapStyle>(MapStyle.DARK);
  const [globeOpacity, setGlobeOpacity] = useState<number>(0.3);
  const [showBorders, setShowBorders] = useState<boolean>(true);

  // Calculate centroid whenever points change
  const centroid: GeoCentroid | null = useMemo(() => {
    return calculateCentroid(points);
  }, [points]);

  const handleAddPoint = async (input: string) => {
    setLoading(true);
    try {
      const result = await parseLocation(input);
      if (result) {
        const newPoint: GeoPoint = {
          id: crypto.randomUUID(),
          lat: result.lat,
          lng: result.lng,
          name: result.name,
          color: COLORS[points.length % COLORS.length]
        };
        setPoints(prev => [...prev, newPoint]);
      } else {
        alert("Could not find that location. Please try being more specific.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePoint = (id: string) => {
    setPoints(prev => prev.filter(p => p.id !== id));
  };

  const handleZoomIn = () => {
    globeRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    globeRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* The 3D Globe Layer */}
      <GlobeViewer 
        ref={globeRef}
        points={points} 
        centroid={centroid} 
        mode={mode}
        connectionStyle={connectionStyle}
        globeOpacity={globeOpacity}
        mapStyle={mapStyle}
        showBorders={showBorders}
      />

      {/* The UI Layer */}
      <OverlayUI 
        points={points}
        centroid={centroid}
        onAddPoint={handleAddPoint}
        onRemovePoint={handleRemovePoint}
        loading={loading}
        mode={mode}
        setMode={setMode}
        connectionStyle={connectionStyle}
        setConnectionStyle={setConnectionStyle}
        globeOpacity={globeOpacity}
        setGlobeOpacity={setGlobeOpacity}
        mapStyle={mapStyle}
        setMapStyle={setMapStyle}
        showBorders={showBorders}
        setShowBorders={setShowBorders}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  );
};

export default App;