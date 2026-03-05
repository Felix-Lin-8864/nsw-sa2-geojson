import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

type AnyFeature = Feature<Geometry, GeoJsonProperties>;
type AnyFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Smooth rendering and interaction tuning
const map: L.Map = L.map('map', {
  preferCanvas: true,
  zoomAnimation: true,
  wheelDebounceTime: 10,
  wheelPxPerZoomLevel: 60,
  inertia: true,
  inertiaDeceleration: 3000,
}).setView([-33.8688, 151.2093], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  updateWhenIdle: true,
}).addTo(map);

// RNG-based Cancer Atlas–style choropleth ramp:
// blue (low) → yellow/neutral (average) → red (high) in discrete bands.
function valueToCancerAtlasColor(value: number): string {
  const v = Math.max(0, Math.min(1, value));

  if (v < 0.15) return '#2166ac'; // dark blue (much lower)
  if (v < 0.3) return '#67a9cf';  // mid blue
  if (v < 0.45) return '#d1e5f0'; // pale blue
  if (v < 0.6) return '#f7f7f7';  // near average (neutral / yellowish-light)
  if (v < 0.75) return '#fddbc7'; // pale orange
  if (v < 0.9) return '#ef8a62';  // orange
  return '#b2182b';               // dark red (much higher)
}

fetch('/ABSStatisticalAreasLevel2_EPSG4326.geojson')
  .then((response: Response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((data: any) => {
    const geoJsonData: AnyFeatureCollection = data.ABSStatisticalAreasLevel2;
    if (!geoJsonData || geoJsonData.type !== 'FeatureCollection') {
      throw new Error('Invalid GeoJSON structure: expected FeatureCollection in ABSStatisticalAreasLevel2');
    }
    L.geoJSON(geoJsonData, {
      style: (feature?: AnyFeature | null) => {
        const props = (feature?.properties || {}) as any;

        if (typeof props._rngValue !== 'number') {
          props._rngValue = Math.random();
        }

        const value: number = props._rngValue;
        const fillColor = valueToCancerAtlasColor(value);

        return {
          color: '#000000',
          weight: 0.8,
          opacity: 1,
          fillColor,
          fillOpacity: 0.9,
        };
      },
      onEachFeature: (feature: AnyFeature, layer: L.Layer) => {
        const props = feature.properties;
        if (!props) return;

        const name = (props as any).name ?? 'Unnamed';
        let popupContent: string = '<h3>' + name + '</h3>';

        for (const key in props as any) {
          if (key !== 'name') {
            popupContent += '<p><strong>' + key + ':</strong> ' + (props as any)[key] + '</p>';
          }
        }

        (layer as L.Path).bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch((error: Error) => {
    console.error('Error loading GeoJSON:', error);
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `<h2>Error loading GeoJSON</h2><p>${error.message}</p>`;
    errorDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; background: white; padding: 10px; border: 1px solid red; z-index: 1000;';
    document.body.appendChild(errorDiv);
  });