/*
===============================================================================
Built-up Area and Nighttime Lights Overlay Analysis (2021)
===============================================================================

Study Area:
Tehran Megaregion, Iran

Datasets:
- ESA WorldCover 2021
- VIIRS Nighttime Lights (VCMSLCFG)

Objective:
Identify spatial correspondence between built-up areas and
nighttime light intensity to support metropolitan growth
and urbanization analysis.

Outputs:
- Built-up Area Mask
- Nighttime Lights Mask
- Overlay Classification Map

Classification:
1 = Built-up Only
2 = Nighttime Lights Only
3 = Built-up + Nighttime Lights

Author:
Zahra Pahlavan
University of Tehran
===============================================================================
*/


// =====================================================
// 1. Study Area
// =====================================================

var fallback = ee.Geometry.Rectangle(
  [50.9, 34.25, 52.33, 36.10],
  null,
  false
);

var gaulL2 = ee.FeatureCollection('FAO/GAUL/2015/level2');

var provinces = gaulL2.filter(
  ee.Filter.inList('ADM1_NAME', ['Tehran', 'Alborz'])
);

var regionAll = ee.Geometry(
  ee.Algorithms.If(
    provinces.size().gt(0),
    provinces.geometry(),
    fallback
  )
);

var excludedCounties = [
  'Firuzkuh',
  'Firuz Kuh',
  'Firoozkooh',
  'Firouzkouh',
  'Taleqan',
  'Taleghan'
];

var excludedAreas = provinces.filter(
  ee.Filter.inList('ADM2_NAME', excludedCounties)
);

var excludedGeometry = ee.Geometry(
  ee.Algorithms.If(
    excludedAreas.size().gt(0),
    excludedAreas.geometry(),
    ee.Geometry.MultiPolygon([])
  )
);

var megaregion = ee.Geometry(regionAll)
  .difference(excludedGeometry, 1);

megaregion = ee.Geometry(
  ee.Algorithms.If(
    megaregion.area(1).gt(0),
    megaregion,
    fallback
  )
);

Map.centerObject(megaregion, 9);

Map.addLayer(
  ee.Image().paint(megaregion, 0, 2),
  {palette:['00ffff']},
  'Megaregion Boundary'
);


// =====================================================
// 2. Built-up Areas (ESA WorldCover 2021)
// =====================================================

var worldCover = ee.ImageCollection('ESA/WorldCover/v200')
  .filterDate('2021-01-01', '2021-12-31')
  .first()
  .select('Map')
  .clip(megaregion);

var builtMask = worldCover.eq(50);


// =====================================================
// 3. Nighttime Lights (VIIRS 2021)
// =====================================================

var viirsCollection = ee.ImageCollection(
  'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG'
)
  .filterDate('2021-01-01', '2021-12-31')
  .select('avg_rad')
  .map(function(img) {
    return img
      .clip(megaregion)
      .unmask(0)
      .resample('bilinear');
  });

var viirsAnnual = viirsCollection.mean()
  .reproject({
    crs: 'EPSG:4326',
    scale: 750
  });

var lightThreshold = 0.15;

var viirsScaled = viirsAnnual
  .unitScale(0, 20)
  .clamp(0, 1);

var lightMask = viirsScaled.gt(lightThreshold);


// =====================================================
// 4. Overlay Classification
// =====================================================

var builtOnly = builtMask.eq(1)
  .and(lightMask.eq(0));

var lightOnly = builtMask.eq(0)
  .and(lightMask.eq(1));

var bothClasses = builtMask.eq(1)
  .and(lightMask.eq(1));

var overlay = ee.Image(0)
  .where(builtOnly, 1)
  .where(lightOnly, 2)
  .where(bothClasses, 3)
  .selfMask()
  .clip(megaregion);


// =====================================================
// 5. Visualization
// =====================================================

var overlayVis = {
  min: 1,
  max: 3,
  palette: [
    '#ff3b3b',
    '#2f6de0',
    '#ffd400'
  ]
};

Map.addLayer(
  overlay,
  overlayVis,
  'Built-up vs Nighttime Lights Overlay'
);


// =====================================================
// 6. Export Results
// =====================================================

Export.image.toDrive({
  image: overlay.toByte(),
  description:
    'Builtup_Nightlights_Overlay_2021_TehranMegaregion',
  folder: 'GEE',
  fileNamePrefix:
    'Builtup_Nightlights_Overlay_2021_TehranMegaregion',
  region: megaregion,
  scale: 60,
  maxPixels: 1e13
});

Export.table.toDrive({
  collection: ee.FeatureCollection(megaregion)
    .map(function(f) {
      return f.set({
        Name: 'Tehran_Megaregion'
      });
    }),
  description: 'TehranMegaregion_Boundary',
  folder: 'GEE',
  fileNamePrefix: 'TehranMegaregion_Boundary',
  fileFormat: 'SHP'
});
