/*
Surface Water Change Analysis (2009–2021)

Study Area:
Tehran Megaregion

Datasets:
- JRC Global Surface Water
- ESA WorldCover 2021

Objective:
Comparison of surface water resources between 2009 and 2021.

Methods:
- Water extraction
- Temporal comparison
- GIS export

Author:
Zahra Pahlavan
University of Tehran
*/
/*
===============================================================================
Surface Water Change Analysis (2009–2021)
===============================================================================

Study Area:
Tehran Megaregion (Tehran and Alborz Provinces), Iran

Datasets:
- JRC Global Surface Water (2009)
- ESA WorldCover 2021

Objective:
Compare surface water distribution between 2009 and 2021
using Earth Observation datasets.

Outputs:
- Surface Water Map (2009)
- Surface Water Map (2021)

Author:
Zahra Pahlavan
University of Tehran

===============================================================================
*/

// -----------------------------------------------------------------------------
// 1. Define Study Area
// -----------------------------------------------------------------------------

var megaregion = ee.Geometry.Polygon([
  [49.95, 33.90],
  [49.95, 36.40],
  [52.75, 36.40],
  [52.75, 33.90]
]);

Map.centerObject(megaregion, 8);
Map.setOptions('SATELLITE');

// -----------------------------------------------------------------------------
// 2. Surface Water Extraction (JRC 2009)
// -----------------------------------------------------------------------------

var jrc = ee.ImageCollection('JRC/GSW1_4/YearlyHistory')
  .filterDate('2009-01-01', '2009-12-31')
  .first()
  .select('waterClass')
  .clip(megaregion);

// Water Classes
// 0 = No Water
// 1 = Seasonal Water
// 2 = Permanent Water

var permanentWater2009 = jrc
  .eq(2)
  .selfMask()
  .rename('Permanent_Water_2009');

var seasonalWater2009 = jrc
  .eq(1)
  .selfMask()
  .rename('Seasonal_Water_2009');

var allWater2009 = jrc
  .gt(0)
  .selfMask()
  .rename('Surface_Water_2009');

// -----------------------------------------------------------------------------
// 3. Surface Water Extraction (ESA WorldCover 2021)
// -----------------------------------------------------------------------------

var worldCover = ee.Image('ESA/WorldCover/v200/2021')
  .select('Map')
  .clip(megaregion);

// ESA Classes
// 80 = Water Bodies
// 90 = Herbaceous Wetlands

var water2021 = worldCover
  .eq(80)
  .rename('Water_Bodies_2021');

var wetland2021 = worldCover
  .eq(90)
  .rename('Wetlands_2021');

var allWater2021 = water2021
  .add(wetland2021)
  .gt(0)
  .selfMask()
  .rename('Surface_Water_2021');

// -----------------------------------------------------------------------------
// 4. Visualization
// -----------------------------------------------------------------------------

Map.addLayer(
  allWater2009,
  {palette: ['#00aaff']},
  'Surface Water 2009'
);

Map.addLayer(
  permanentWater2009,
  {palette: ['#0044cc']},
  'Permanent Water 2009',
  false
);

Map.addLayer(
  seasonalWater2009,
  {palette: ['#55ddff']},
  'Seasonal Water 2009',
  false
);

Map.addLayer(
  allWater2021,
  {palette: ['#2b7bba']},
  'Surface Water 2021'
);

// -----------------------------------------------------------------------------
// 5. Export Results
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: allWater2009,
  description: 'SurfaceWater_2009_TehranMegaregion',
  folder: 'GEE',
  fileNamePrefix: 'SurfaceWater_2009_TehranMegaregion',
  region: megaregion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: allWater2021,
  description: 'SurfaceWater_2021_TehranMegaregion',
  folder: 'GEE',
  fileNamePrefix: 'SurfaceWater_2021_TehranMegaregion',
  region: megaregion,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
