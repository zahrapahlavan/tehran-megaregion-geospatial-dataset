/*
Precipitation Change Analysis (2009–2021)

Study Area: Tehran Megaregion, Iran
Dataset: ERA5-Land Daily Aggregates

Indicator:
- Annual Precipitation (mm)

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

var exportRegion = megaregion
  .buffer(20000)
  .bounds();

Map.centerObject(megaregion, 8);

Map.addLayer(
  ee.Image().paint(megaregion, 0, 2),
  {palette: ['000000']},
  'Megaregion'
);


// -----------------------------------------------------------------------------
// 2. Annual Precipitation Function
// -----------------------------------------------------------------------------

function annualPrecipMM(year) {

  var collection = ee.ImageCollection(
    'ECMWF/ERA5_LAND/DAILY_AGGR'
  )
    .filterDate(
      year + '-01-01',
      year + '-12-31'
    )
    .select('total_precipitation_sum');

  return collection
    .sum()
    .multiply(1000)
    .clip(megaregion)
    .rename('Pmm_' + year);
}


// -----------------------------------------------------------------------------
// 3. Calculate Annual Precipitation
// -----------------------------------------------------------------------------

var precip2009 = annualPrecipMM(2009);

var precip2021 = annualPrecipMM(2021);

var precipChange = precip2021
  .subtract(precip2009)
  .rename('Pmm_diff_21_09');


// -----------------------------------------------------------------------------
// 4. Visualization Parameters
// -----------------------------------------------------------------------------

var visPrecip = {
  min: 100,
  max: 600,
  palette: [
    '#f7fbff',
    '#deebf7',
    '#c6dbef',
    '#9ecae1',
    '#6baed6',
    '#4292c6',
    '#2171b5',
    '#08519c',
    '#08306b'
  ]
};

var visDiff = {
  min: -150,
  max: 150,
  palette: [
    '#b2182b',
    '#ef8a62',
    '#fddbc7',
    '#f7f7f7',
    '#d1e5f0',
    '#67a9cf',
    '#2166ac'
  ]
};


// -----------------------------------------------------------------------------
// 5. Display Results
// -----------------------------------------------------------------------------

Map.addLayer(
  precip2009.reproject({
    crs: 'EPSG:4326',
    scale: 2500
  }),
  visPrecip,
  'Annual Precipitation 2009'
);

Map.addLayer(
  precip2021.reproject({
    crs: 'EPSG:4326',
    scale: 2500
  }),
  visPrecip,
  'Annual Precipitation 2021'
);

Map.addLayer(
  precipChange.reproject({
    crs: 'EPSG:4326',
    scale: 2500
  }),
  visDiff,
  'Precipitation Change'
);


// -----------------------------------------------------------------------------
// 6. Export Results
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: precip2009.resample('bilinear'),
  description: 'TehranMegaregion_Precip_2009_ERA5Land_mm',
  folder: 'GEE',
  region: exportRegion,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: precip2021.resample('bilinear'),
  description: 'TehranMegaregion_Precip_2021_ERA5Land_mm',
  folder: 'GEE',
  region: exportRegion,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: precipChange.resample('bilinear'),
  description: 'TehranMegaregion_Precip_DIFF_2021minus2009_mm',
  folder: 'GEE',
  region: exportRegion,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});


// -----------------------------------------------------------------------------
// 7. Summary Statistics
// -----------------------------------------------------------------------------

var stats2009 = precip2009.reduceRegion({
  reducer: ee.Reducer.minMax()
    .combine({
      reducer2: ee.Reducer.mean(),
      sharedInputs: true
    }),
  geometry: megaregion,
  scale: 5000,
  maxPixels: 1e12
});

var stats2021 = precip2021.reduceRegion({
  reducer: ee.Reducer.minMax()
    .combine({
      reducer2: ee.Reducer.mean(),
      sharedInputs: true
    }),
  geometry: megaregion,
  scale: 5000,
  maxPixels: 1e12
});

print(
  'Annual Precipitation 2009 (mm)',
  stats2009
);

print(
  'Annual Precipitation 2021 (mm)',
  stats2021
);
