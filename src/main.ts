import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

type AnyFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

const MAPBOX_ACCESS_TOKEN =
  '***REMOVED***REMOVED***REMOVED***';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [151.2093, -33.8688],
  zoom: 10,
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

map.on('load', () => {
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
        throw new Error(
          'Invalid GeoJSON structure: expected FeatureCollection in ABSStatisticalAreasLevel2'
        );
      }

      geoJsonData.features.forEach((feature) => {
        const props = (feature.properties ||= {} as GeoJsonProperties);
        if (typeof (props as any)._rngValue !== 'number') {
          (props as any)._rngValue = Math.random();
        }
      });

      map.addSource('sa2', {
        type: 'geojson',
        data: geoJsonData,
      });

      map.addLayer({
        id: 'sa2-fill',
        type: 'fill',
        source: 'sa2',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', '_rngValue'],
            0,
            'rgb(33,102,172)',
            0.5,
            'rgb(247,247,247)',
            1,
            'rgb(178,24,43)',
          ],
          'fill-opacity': 0.9,
          'fill-outline-color': '#000000',
        },
      });

      map.on('click', 'sa2-fill', (e: any) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const props = feature.properties || {};
        const name = props.name ?? 'Unnamed';
        let popupContent = `<h3>${name}</h3>`;

        for (const key in props) {
          if (key !== 'name') {
            popupContent += `<p><strong>${key}:</strong> ${props[key]}</p>`;
          }
        }

        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
      });
    })
    .catch((error: Error) => {
      console.error('Error loading GeoJSON:', error);
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `<h2>Error loading GeoJSON</h2><p>${error.message}</p>`;
      errorDiv.style.cssText =
        'position: absolute; top: 10px; left: 10px; background: white; padding: 10px; border: 1px solid red; z-index: 1000;';
      document.body.appendChild(errorDiv);
    });
});