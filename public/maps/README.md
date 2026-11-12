# Nigeria boundaries

These locally served GeoJSON files contain real geographic boundaries. Vehicle positions,
journeys and hubs in the application remain simulated.

- Source: GRID3, distributed by [geoBoundaries gbOpen](https://www.geoboundaries.org/).
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
- Geography represented: 2022; geoBoundaries build: 12 December 2023.
- Pinned source revision: `9469f09` of `wmgeolab/geoBoundaries`.
- `nigeria-states.geojson`: 36 states and FCT (ADM1), boundary ID `NGA-ADM1-27671186`.
- `src/features/movement/assets/nigeria-country.geojson`: national outline (ADM0), boundary ID `NGA-ADM0-39225661`; bundled with the map so neighbouring countries are hidden immediately, without a boundary fetch.
- Files are upstream simplified geometries, copied without further modification.

Source files:

- https://github.com/wmgeolab/geoBoundaries/blob/9469f09/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson
- https://github.com/wmgeolab/geoBoundaries/blob/9469f09/releaseData/gbOpen/NGA/ADM0/geoBoundaries-NGA-ADM0_simplified.geojson

The application constructs an opaque, borderless outside mask from the national outline.
Attribution is shown on the map. OpenStreetMap tiles are still loaded over the network.
