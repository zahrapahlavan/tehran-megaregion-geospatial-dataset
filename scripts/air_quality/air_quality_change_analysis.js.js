/*
Air Quality Change Analysis (2019–2021)

Study Area: Tehran Megaregion, Iran
Dataset: Sentinel-5P TROPOMI

Indicators:
- Nitrogen Dioxide (NO₂)
- Carbon Monoxide (CO)

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

var exportRegion = megaregion.buffer(20000).bounds();

Map.centerObject(megaregion, 8);


// -----------------------------------------------------------------------------
// 2. Analysis Years
// -----------------------------------------------------------------------------

var yearA = 2019;
var yearB = 2021;


// -----------------------------------------------------------------------------
// 3. Quality Threshold
// -----------------------------------------------------------------------------

var qaThreshold = 0.75;


// -----------------------------------------------------------------------------
// 4. Annual NO₂ Function
// -----------------------------------------------------------------------------

function annualNO2(year) {

  return ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2')
    .filterBounds(megaregion)
    .filterDate(year + '-01-01', year + '-12-31')
    .filter(ee.Filter.gt('QA_VALUE', qaThreshold))
    .select('tropospheric_NO2_column_number_density')
    .mean()
    .clip(exportRegion)
    .rename('NO2');
}


// -----------------------------------------------------------------------------
// 5. Annual CO Function
// -----------------------------------------------------------------------------

function annualCO(year) {

  return ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_CO')
    .filterBounds(megaregion)
    .filterDate(year + '-01-01', year + '-12-31')
    .filter(ee.Filter.gt('QA_VALUE', qaThreshold))
    .select('CO_column_number_density')
    .mean()
    .clip(exportRegion)
    .rename('CO');
}


// -----------------------------------------------------------------------------
// 6. Calculate Annual Means
// -----------------------------------------------------------------------------

var no2_2019 = annualNO2(yearA);
var no2_2021 = annualNO2(yearB);

var co_2019 = annualCO(yearA);
var co_2021 = annualCO(yearB);


// -----------------------------------------------------------------------------
// 7. Change Detection
// -----------------------------------------------------------------------------

var no2_change = no2_2021.subtract(no2_2019);

var co_change = co_2021.subtract(co_2019);


// -----------------------------------------------------------------------------
// 8. Visualization Parameters
// -----------------------------------------------------------------------------

var visNO2 = {
  min: 0,
  max: 300,
  palette: [
    '#ffffcc',
    '#a1dab4',
    '#41b6c4',
    '#2c7fb8',
    '#253494'
  ]
};

var visCO = {
  min: 0,
  max: 400,
  palette: [
    '#fff7ec',
    '#fee8c8',
    '#fdbb84',
    '#e34a33',
    '#b30000'
  ]
};

var visDiff = {
  min: -150,
  max: 150,
  palette: [
    '#313695',
    '#74add1',
    '#e0f3f8',
    '#ffffbf',
    '#fdae61',
    '#d73027',
    '#a50026'
  ]
};


// -----------------------------------------------------------------------------
// 9. Display Results
// -----------------------------------------------------------------------------

Map.addLayer(
  no2_2019.multiply(1e6),
  visNO2,
  'NO2 2019'
);

Map.addLayer(
  no2_2021.multiply(1e6),
  visNO2,
  'NO2 2021'
);

Map.addLayer(
  no2_change.multiply(1e6),
  visDiff,
  'NO2 Change'
);

Map.addLayer(
  co_2019.multiply(1e6),
  visCO,
  'CO 2019',
  false
);

Map.addLayer(
  co_2021.multiply(1e6),
  visCO,
  'CO 2021',
  false
);

Map.addLayer(
  co_change.multiply(1e6),
  visDiff,
  'CO Change',
  false
);


// -----------------------------------------------------------------------------
// 10. Export Results
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: no2_change,
  description: 'NO2_Change_2019_2021_TehranMegaregion',
  folder: 'GEE',
  region: exportRegion,
  scale: 10000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: co_change,
  description: 'CO_Change_2019_2021_TehranMegaregion',
  folder: 'GEE',
  region: exportRegion,
  scale: 10000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
