import L from "leaflet";

export const nigeriaBounds = L.latLngBounds([4.2, 2.65], [13.9, 14.7]);
export const nigeriaNavigationBounds = nigeriaBounds.pad(0.12);

// Envelopes of each zone’s states, calculated from the bundled GRID3/geoBoundaries
// dataset in public/maps/nigeria-states.geojson. These do not depend on vehicle positions.
export const geopoliticalZoneBounds = {
  "North West": L.latLngBounds([9.000653, 3.475000], [13.885714, 10.605630]),
  "North East": L.latLngBounds([6.433332, 8.745074], [13.721309, 14.677968]),
  "North Central": L.latLngBounds([6.401266, 2.742958], [11.390633, 10.640037]),
  "South West": L.latLngBounds([5.887739, 2.692613], [9.188311, 6.004126]),
  "South East": L.latLngBounds([4.821805, 6.600627], [7.101550, 8.456825]),
  "South South": L.latLngBounds([4.270204, 4.976784], [7.591417, 9.474412]),
};

export type GeopoliticalZone = keyof typeof geopoliticalZoneBounds;
export type MapZone = "All zones" | GeopoliticalZone;
