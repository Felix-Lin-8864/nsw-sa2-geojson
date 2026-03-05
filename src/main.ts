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

const map: L.Map = L.map('map').setView([-33.8688, 151.2093], 10); // Centered on Sydney, adjust as needed

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
      style: {
        color: '#00008B',
        weight: 6,
        opacity: 1,
        fillColor: '#00008B',
        fillOpacity: 0.35
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