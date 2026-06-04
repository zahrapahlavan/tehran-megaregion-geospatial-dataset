/*
NDVI Change Analysis (2009–2021)

Study Area:
Tehran Megaregion (Tehran and Alborz Provinces)

Dataset:
MODIS MOD13A2 Version 6.1

Objective:
Assessment of vegetation condition changes between 2009 and 2021.

Methods:
- Annual NDVI compositing
- Temporal comparison
- Change detection
- GIS export

Author:
Zahra Pahlavan
University of Tehran
*/
/*
===============================================================================
NDVI Change Analysis (2009–2021)
===============================================================================

Study Area:
Tehran Megaregion (Tehran and Alborz Provinces), Iran

Dataset:
MODIS MOD13A2 Version 6.1

Objective:
Assess vegetation condition changes between 2009 and 2021 using
annual mean NDVI composites.

Outputs:
- NDVI 2009
- NDVI 2021
- NDVI Change (2021–2009)

Author:
Zahra Pahlavan
University of Tehran

===============================================================================
*/

// -----------------------------------------------------------------------------
// 1. Define Study Area
// -----------------------------------------------------------------------------

var region = ee.Geometry.Polygon([
  [49.8, 33.8],
  [49.8, 36.6],
  [52.9, 36.6],
  [52.9, 33.8]
]).buffer(20000);

Map.centerObject(region, 8);
Map.setOptions('SATELLITE');

// -----------------------------------------------------------------------------
// 2. Function: Annual Mean NDVI
// -----------------------------------------------------------------------------

function getAnnualNDVI(year) {

  var collection = ee.ImageCollection("MODIS/061/MOD13A2")
    .filterDate(year + '-01-01', year + '-12-31')
    .select('NDVI')
    .map(function(image) {

      return image
        .multiply(0.0001)
        .clip(region)
        .copyProperties(image, ['system:time_start']);

    });

  return collection
    .mean()
    .rename('NDVI_' + year);
}

// -----------------------------------------------------------------------------
// 3. Generate Annual NDVI Layers
// -----------------------------------------------------------------------------

var ndvi2009 = getAnnualNDVI(2009);
var ndvi2021 = getAnnualNDVI(2021);

// -----------------------------------------------------------------------------
// 4. NDVI Change Detection
// -----------------------------------------------------------------------------

var ndviChange = ndvi2021
  .subtract(ndvi2009)
  .rename('NDVI_Change');

// -----------------------------------------------------------------------------
// 5. Visualization Parameters
// -----------------------------------------------------------------------------

var ndviVis = {
  min: 0,
  max: 0.8,
  palette: ['brown', 'yellow', 'green']
};

var changeVis = {
  min: -0.3,
  max: 0.3,
  palette: [
    '#a50026',
    '#fdae61',
    '#ffffbf',
    '#a6d96a',
    '#1a9850'
  ]
};

// -----------------------------------------------------------------------------
// 6. Display Results
// -----------------------------------------------------------------------------

Map.addLayer(ndvi2009, ndviVis, 'NDVI 2009');

Map.addLayer(ndvi2021, ndviVis, 'NDVI 2021');

Map.addLayer(
  ndviChange,
  changeVis,
  'NDVI Change (2021 - 2009)'
);

// -----------------------------------------------------------------------------
// 7. Export Outputs
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: ndvi2009,
  description: 'NDVI_2009_TehranMegaregion',
  folder: 'GEE',
  fileNamePrefix: 'NDVI_2009_TehranMegaregion',
  region: region,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndvi2021,
  description: 'NDVI_2021_TehranMegaregion',
  folder: 'GEE',
  fileNamePrefix: 'NDVI_2021_TehranMegaregion',
  region: region,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndviChange,
  description: 'NDVI_Change_2009_2021_TehranMegaregion',
  folder: 'GEE',
  fileNamePrefix: 'NDVI_Change_2009_2021_TehranMegaregion',
  region: region,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
