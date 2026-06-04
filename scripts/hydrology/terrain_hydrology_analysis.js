/*
Terrain and Hydrological Analysis

Study Area: Tehran Megaregion, Iran
Dataset: SRTM DEM (30 m)

Indicators:
- Elevation
- Slope
- Hillshade
- Drainage Network Proxy

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

Map.addLayer(
  ee.Image().paint(megaregion, 0, 2),
  {palette: ['black']},
  'Megaregion'
);


// -----------------------------------------------------------------------------
// 2. Load DEM
// -----------------------------------------------------------------------------

var dem = ee.Image('USGS/SRTMGL1_003')
  .clip(exportRegion)
  .rename('elev_m');


// -----------------------------------------------------------------------------
// 3. DEM Conditioning
// -----------------------------------------------------------------------------

var demFilled;

if (ee.Terrain.fillMinima) {

  demFilled = ee.Terrain.fillMinima(dem);

} else {

  var demSmooth = dem.focal_mean(
    1,
    'square',
    'pixels',
    3
  );

  demFilled = dem.max(demSmooth);
}


// -----------------------------------------------------------------------------
// 4. Terrain Derivatives
// -----------------------------------------------------------------------------

var slope = ee.Terrain.slope(demFilled)
  .rename('slope_deg');

var hillshade = ee.Terrain.hillshade({
  input: demFilled,
  azimuth: 315,
  elevation: 45
});


// -----------------------------------------------------------------------------
// 5. Drainage Network Proxy
// -----------------------------------------------------------------------------

var dx = demFilled.convolve(
  ee.Kernel.laplacian8()
);

var flowAcc = dx
  .multiply(-1)
  .rename('flow_acc');

flowAcc = flowAcc.where(
  flowAcc.lt(0),
  0
);

var flowAccVis = flowAcc.add(1).log();

var threshold = 100;

var streamsMask = flowAcc
  .gte(threshold)
  .selfMask()
  .clip(megaregion)
  .rename('streams_bin');

var streamsVector = streamsMask.reduceToVectors({
  geometry: megaregion,
  scale: 30,
  geometryType: 'polyline',
  labelProperty: 'type',
  maxPixels: 1e13
}).map(function(f) {
  return f.set('type', 'stream');
});


// -----------------------------------------------------------------------------
// 6. Visualization
// -----------------------------------------------------------------------------

Map.addLayer(
  hillshade,
  {min: 0, max: 255},
  'Hillshade'
);

Map.addLayer(
  demFilled,
  {
    min: 600,
    max: 3800,
    palette: [
      '#f7fbff',
      '#deebf7',
      '#9ecae1',
      '#3182bd',
      '#08519c'
    ]
  },
  'DEM'
);

Map.addLayer(
  slope,
  {
    min: 0,
    max: 60,
    palette: [
      '#ffffe5',
      '#fee391',
      '#fec44f',
      '#fe9929',
      '#cc4c02',
      '#8c2d04'
    ]
  },
  'Slope'
);

Map.addLayer(
  flowAccVis,
  {
    min: 0,
    max: 8,
    palette: [
      '#deebf7',
      '#9ecae1',
      '#3182bd',
      '#08519c'
    ]
  },
  'Drainage Potential'
);

Map.addLayer(
  streamsMask,
  {palette: ['#0040ff']},
  'Streams (Raster)'
);

Map.addLayer(
  streamsVector.style({
    color: '#0033cc',
    width: 2
  }),
  {},
  'Streams (Vector)'
);


// -----------------------------------------------------------------------------
// 7. Export Results
// -----------------------------------------------------------------------------

Export.image.toDrive({
  image: demFilled,
  description: 'DEM_TehranMegaregion',
  folder: 'GEE',
  region: exportRegion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: slope,
  description: 'Slope_TehranMegaregion',
  folder: 'GEE',
  region: exportRegion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: flowAcc,
  description: 'DrainagePotential_TehranMegaregion',
  folder: 'GEE',
  region: exportRegion,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.table.toDrive({
  collection: streamsVector,
  description: 'Streams_Vector_TehranMegaregion',
  folder: 'GEE',
  fileFormat: 'SHP'
});
