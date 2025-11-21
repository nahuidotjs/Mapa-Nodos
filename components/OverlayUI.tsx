import React, { useState } from 'react';
import { GeoPoint, GeoCentroid, ConnectionMode, ConnectionStyle, MapStyle } from '../types';
import { calculateDistanceKm } from '../utils/geoUtils';
import { Loader2, MapPin, Plus, Trash2, Network, Share2, Waypoints, Globe, ArrowRightLeft, Palette, Search, ZoomIn, ZoomOut, BoxSelect } from 'lucide-react';

interface OverlayUIProps {
  points: GeoPoint[];
  centroid: GeoCentroid | null;
  onAddPoint: (input: string) => Promise<void>;
  onRemovePoint: (id: string) => void;
  loading: boolean;
  mode: ConnectionMode;
  setMode: (mode: ConnectionMode) => void;
  connectionStyle: ConnectionStyle;
  setConnectionStyle: (style: ConnectionStyle) => void;
  globeOpacity: number;
  setGlobeOpacity: (opacity: number) => void;
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
  showBorders: boolean;
  setShowBorders: (show: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const OverlayUI: React.FC<OverlayUIProps> = ({ 
  points, 
  centroid, 
  onAddPoint, 
  onRemovePoint, 
  loading, 
  mode, 
  setMode,
  connectionStyle,
  setConnectionStyle,
  globeOpacity,
  setGlobeOpacity,
  mapStyle,
  setMapStyle,
  showBorders,
  setShowBorders,
  onZoomIn,
  onZoomOut
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    await onAddPoint(inputValue);
    setInputValue('');
  };

  const getDistances = () => {
    if (mode === ConnectionMode.STAR && centroid && points.length > 0) {
      return points.map(p => ({
        label: `${p.name} ↔ Center`,
        val: calculateDistanceKm(p.lat, p.lng, centroid.lat, centroid.lng)
      }));
    }
    if (mode === ConnectionMode.PATH && points.length > 1) {
       const dists = [];
       for(let i=0; i<points.length-1; i++) {
         dists.push({
           label: `${points[i].name} ↔ ${points[i+1].name}`,
           val: calculateDistanceKm(points[i].lat, points[i].lng, points[i+1].lat, points[i+1].lng)
         });
       }
       return dists;
    }
    // For mesh, show total points count or specific pair if small
    if (mode === ConnectionMode.MESH && points.length === 2) {
       return [{
         label: `${points[0].name} ↔ ${points[1].name}`,
         val: calculateDistanceKm(points[0].lat, points[0].lng, points[1].lat, points[1].lng)
       }];
    }
    return [];
  };

  const distances = getDistances();

  return (
    <>
      {/* Zoom Controls - Floating separately */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        <button 
          onClick={onZoomIn}
          className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-blue-600 transition-all shadow-xl"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-6 h-6" />
        </button>
        <button 
          onClick={onZoomOut}
          className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-blue-600 transition-all shadow-xl"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Overlay */}
      <div className="absolute top-0 left-0 p-6 w-full max-w-md h-full pointer-events-none flex flex-col gap-4">
        {/* Interactive Container */}
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[95vh] overflow-hidden">
          <div className="flex items-center gap-2 mb-2 shrink-0">
            <div className="bg-blue-500 p-2 rounded-full">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">Global Connector</h1>
              <p className="text-xs text-gray-400 mt-1">Transparent Sphere Visualization</p>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Location (e.g. Mexico City)"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </form>

          <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
            {/* Visual Settings Group */}
            <div className="bg-white/5 rounded-lg p-3 space-y-3 shrink-0">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-3 h-3" /> Visual Settings
              </h3>
              
              {/* Map Style Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: MapStyle.DARK, label: 'Dark' },
                  { id: MapStyle.STREET, label: 'Map' },
                  { id: MapStyle.SATELLITE, label: 'Sat' },
                  { id: MapStyle.BLUE, label: 'Blue' }
                ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setMapStyle(s.id)}
                      className={`px-1 py-1.5 text-[10px] rounded border transition-colors ${
                        mapStyle === s.id 
                          ? 'bg-blue-500/30 border-blue-400 text-blue-100' 
                          : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {s.label}
                    </button>
                ))}
              </div>

              {/* Opacity Slider */}
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="flex items-center gap-1 opacity-70">Sphere Opacity</span>
                  <span className="font-mono text-[10px]">{Math.round(globeOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={globeOpacity}
                  onChange={(e) => setGlobeOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Borders Toggle */}
              <div className="flex gap-2 mt-2">
                <button
                    onClick={() => setShowBorders(!showBorders)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-sm border transition-colors ${showBorders ? 'bg-white/20 border-white/40 text-white' : 'bg-black/40 border-transparent text-gray-500'}`}
                  >
                  <BoxSelect className="w-3 h-3" /> Borders
                </button>
              </div>

              {/* Connection Style Toggle */}
              <div className="flex bg-black/40 p-1 rounded-md mt-2">
                <button
                  onClick={() => setConnectionStyle(ConnectionStyle.ARC)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-sm transition-colors ${connectionStyle === ConnectionStyle.ARC ? 'bg-white/20 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Globe className="w-3 h-3" /> Arc
                </button>
                <button
                  onClick={() => setConnectionStyle(ConnectionStyle.STRAIGHT)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-sm transition-colors ${connectionStyle === ConnectionStyle.STRAIGHT ? 'bg-white/20 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <ArrowRightLeft className="w-3 h-3" /> Tunnel
                </button>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="shrink-0">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connection Logic</h3>
                <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => setMode(ConnectionMode.STAR)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${mode === ConnectionMode.STAR ? 'bg-blue-500/20 border-blue-400 text-blue-200' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                >
                    <Share2 className="w-4 h-4 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider">Center</span>
                </button>
                <button 
                    onClick={() => setMode(ConnectionMode.MESH)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${mode === ConnectionMode.MESH ? 'bg-red-500/20 border-red-400 text-red-200' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                >
                    <Network className="w-4 h-4 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider">Mesh</span>
                </button>
                <button 
                    onClick={() => setMode(ConnectionMode.PATH)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${mode === ConnectionMode.PATH ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                >
                    <Waypoints className="w-4 h-4 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider">Path</span>
                </button>
                </div>
            </div>

            {/* Points List */}
            <div className="flex flex-col gap-2">
              {points.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm italic border border-dashed border-white/10 rounded-lg">
                  Add locations to plot...
                </div>
              )}
              {points.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-md border border-white/5 group hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: p.color, shadowColor: p.color }}></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">{p.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{p.lat.toFixed(2)}, {p.lng.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemovePoint(p.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Stats Area */}
            {(centroid || distances.length > 0) && (
              <div className="border-t border-white/10 pt-3 shrink-0">
                <div className="space-y-1">
                  {centroid && (
                    <div className="flex justify-between text-xs">
                        <span className="text-cyan-400">Centroid Point</span>
                        <span className="font-mono text-gray-300">{centroid.lat.toFixed(2)}°, {centroid.lng.toFixed(2)}°</span>
                    </div>
                  )}
                  {distances.slice(0, 5).map((d, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-400 truncate max-w-[60%]">{d.label}</span>
                      <span className="font-mono text-white">{d.val.toLocaleString(undefined, { maximumFractionDigits: 0 })} km</span>
                    </div>
                  ))}
                  {distances.length > 5 && <div className="text-[10px] text-center text-gray-600 italic">...and {distances.length - 5} more</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OverlayUI;