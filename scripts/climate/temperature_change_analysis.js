/*
===============================================================================
Temperature Change Analysis (2009–2021)
===============================================================================

Study Area:
Tehran Megaregion, Iran

Dataset:
ERA5-Land Daily Aggregates

Indicator:
Annual Mean Air Temperature (°C)

Objective:
Assess changes in mean annual air temperature between 2009 and 2021
using ERA5-Land climate reanalysis data.

Outputs:
- Mean Temperature 2009
- Mean Temperature 2021
- GeoTIFF exports for GIS analysis

Author:
Zahra Pahlavan
University of Tehran
===============================================================================
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


// -----------------------------------------------------------------------------
// 2. Annual Mean Temperature Function (Kelvin → Celsius)
// -----------------------------------------------------------------------------

function annualMeanTempC(year) {

  var coll = ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR')
    .filterDate(year + '-01-01', year + '-12-31')
    .select('temperature_2m');

  return coll
    .mean()
    .subtract(273.15)
    .clip(megaregion)
    .rename('Tmean_' + year);
}


// -----------------------------------------------------------------------------
// 3. Calculate Annual Mean Temperature
// -----------------------------------------------------------------------------

var T2009 = annualMeanTempC(2009);
var T2021 = annualMeanTempC(2021);


// -----------------------------------------------------------------------------
// 4. Visualization
// -----------------------------------------------------------------------------

Map.centerObject(megaregion, 8);

var vis = {
  min: 0,
  max: 45,
  palette: [
    '#2c7bb6',
    '#abd9e9',
    '#ffffbf',
    '#fdae61',
    '#d7191c'
  ]
};

Map.addLayer(
  T2009.reproject({
    crs: 'EPSG:4326',
    scale: 2500
  }),
  vis,
  'Mean Temperature 2009 (°C)'
);

Map.addLayer(
  T2021.reproject({
    crs: 'EPSG:4326',
    scale: 2500
  }),
  vis,
  'Mean Temperature 2021 (°C)'
);

Map.addLayer(
  ee.Image().paint(megaregion, 0, 2),
  {palette:['000000']},
  'Megaregion Boundary'
);


// -----------------------------------------------------------------------------
// 5. Export Results
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: T2009.resample('bilinear'),
  description: 'TehranMegaregion_Tmean_2009_ERA5Land',
  folder: 'GEE',
  fileNamePrefix: 'TehranMegaregion_Tmean_2009_ERA5Land',
  region: exportRegion,
  scale: 500,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: T2021.resample('bilinear'),
  description: 'TehranMegaregion_Tmean_2021_ERA5Land',
  folder: 'GEE',
  fileNamePrefix: 'TehranMegaregion_Tmean_2021_ERA5Land',
  region: exportRegion,
  scale: 500,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
