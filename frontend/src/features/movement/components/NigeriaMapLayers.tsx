import L from "leaflet";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { useEffect } from "react";
import { GeoJSON, Pane, useMap } from "react-leaflet";
import countryText from "../assets/nigeria-country.geojson?raw";
import {
  geopoliticalZoneBounds,
  nigeriaBounds,
  type MapZone,
} from "../config/nigeriaMap";

const country = JSON.parse(countryText) as FeatureCollection<
  Polygon | MultiPolygon
>;
const outsideNigeria: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
      ...country.features.flatMap(({ geometry }) =>
        geometry.type === "Polygon"
          ? [geometry.coordinates[0]]
          : geometry.coordinates.map((polygon) => polygon[0]),
      ),
    ],
  },
};

export function NigeriaMapLayers({
  zone,
  focused = false,
  onReset,
}: {
  zone: MapZone;
  focused?: boolean;
  onReset(): void;
}) {
  const map = useMap();

  useEffect(() => {
    const bounds =
      zone === "All zones" ? nigeriaBounds : geopoliticalZoneBounds[zone];
    // Refit the selected area when its container changes between desktop and mobile.
    const updateSize = () => {
      map.invalidateSize({ pan: false });
      // getBoundsZoom is clamped by the current minimum; lower it before
      // measuring a smaller container so desktop limits do not crop mobile views.
      map.setMinZoom(3);
      map.setMinZoom(Math.max(3, Math.floor(map.getBoundsZoom(nigeriaBounds))));
      if (!focused) {
        map.stop();
        map.fitBounds(bounds, { padding: [12, 12], animate: false });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, zone, focused]);

  return (
    <>
      <Pane name="outside-nigeria" className="pointer-events-none z-450">
        <GeoJSON
          data={outsideNigeria}
          interactive={false}
          attribution='Boundary: GRID3 / <a href="https://www.geoboundaries.org/">geoBoundaries</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)'
          style={{
            stroke: false,
            fillColor: "#e2e8f0",
            fillOpacity: 1,
            fillRule: "evenodd",
          }}
        />
      </Pane>
      <div
        className="absolute top-3 right-3 z-800 grid gap-1.5 max-w-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-md"
        ref={(element) => {
          if (element) {
            L.DomEvent.disableClickPropagation(element);
            L.DomEvent.disableScrollPropagation(element);
          }
        }}
      >
        <button
          type="button"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 rounded-sm border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600"
          onClick={() => {
            onReset();
            map.stop();
            map.fitBounds(nigeriaBounds, { padding: [12, 12] });
          }}
        >
          View all Nigeria
        </button>
      </div>
    </>
  );
}
