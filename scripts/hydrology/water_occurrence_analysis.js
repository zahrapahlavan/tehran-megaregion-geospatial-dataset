/*
Surface Water Occurrence Analysis

Study Area: Tehran Megaregion, Iran
Dataset: JRC Global Surface Water

Indicators:
- Water Occurrence (%)
- Permanent Water
- Seasonal Water

Author: Zahra Pahlavan
*/


// -----------------------------------------------------------------------------
// 1. Study Area
// -----------------------------------------------------------------------------

var megaregion = ee.Geometry.Polygon([
  [49.95, 33.90],
  [49.95, 36.40],
  [52.75, 36.40],
  [52.75, 33.90]
]);

Map.centerObject(megaregion, 8);
Map.setOptions('TERRAIN');


// -----------------------------------------------------------------------------
// 2. Load Surface Water Dataset
// -----------------------------------------------------------------------------

var gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater');

var occurrence = gsw
  .select('occurrence')
  .clip(megaregion);


// -----------------------------------------------------------------------------
// 3. Water Classification
// -----------------------------------------------------------------------------

var permanentWater = occurrence
  .gte(80)
  .selfMask()
  .rename('Permanent_Water');

var seasonalWater = occurrence
  .gte(10)
  .and(occurrence.lt(80))
  .selfMask()
  .rename('Seasonal_Water');


// -----------------------------------------------------------------------------
// 4. Visualization
// -----------------------------------------------------------------------------

Map.addLayer(
  permanentWater,
  {palette: ['#0b63ff']},
  'Permanent Water'
);

Map.addLayer(
  seasonalWater,
  {palette: ['#29d3d3']},
  'Seasonal Water'
);

Map.addLayer(
  occurrence,
  {
    min: 0,
    max: 100,
    palette: [
      'ffffff',
      'd2f0ff',
      '9ad7ff',
      '5ab0ff',
      '1f7cff',
      '084594'
    ]
  },
  'Water Occurrence (%)',
  false
);


// -----------------------------------------------------------------------------
// 5. Export Results
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: occurrence,
  description: 'WaterOccurrence_TehranMegaregion',
  folder: 'GEE',
  region: megaregion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: permanentWater,
  description: 'PermanentWater_TehranMegaregion',
  folder: 'GEE',
  region: megaregion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: seasonalWater,
  description: 'SeasonalWater_TehranMegaregion',
  folder: 'GEE',
  region: megaregion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
