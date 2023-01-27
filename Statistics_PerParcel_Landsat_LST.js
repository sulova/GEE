/*
Jan 2023

Getting the quarterly statistics of surface temperature (ST_B10) 
for each municipality from Landsat data Level-2 over 5 years.


*/

var start = ee.Date('2015-01-01')
var end = start.advance(5,'year')

var months = ee.List.sequence(1,11);
var years = ee.List.sequence(start.get("year"), end.get("year"));

var bandname = 'ST_B10';

// Municipalities
var mun  = ee.FeatureCollection("projects/geo4gras/assets/dk/DK_MPA");
var addArea = function(feature){
  return feature.set({areaKM: feature.geometry().area().divide(1000 * 1000)
  })};
// Map the area getting function over the FeatureCollection.
var mun = mun.map(addArea);

Map.addLayer(mun,{},'municipalities ')
print('Number of feature:', mun.size())

// Mask 
var mask = ee.Image("projects/geo4gras/assets/dk/satlas-mask-v2");
var aoi = mask.geometry()
Map.setOptions('SATELLITE');
Map.centerObject(aoi, 8);

/// L8 & L9 collection
var bands = ['SR_B2','SR_B3','SR_B4','ST_B10', 'QA_PIXEL'];

var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').select(bands)
            .filterBounds(aoi).map(cloudmask).map(applyScaleFactors)
            .filterMetadata('CLOUD_COVER', 'less_than',100);
            
var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2').select(bands)
            .filterBounds(aoi).map(cloudmask).map(applyScaleFactors)
            .filterMetadata('CLOUD_COVER', 'less_than',100);
var l89 = l9.merge(l8).select(bandname)
//print('L8',l8, 'L9',l9, 'L89', l89)  


//_____Compute median composite per month__________

var nMonths = ee.Number(end.difference(start,'month')).round();
print(nMonths, 'nMonths')


// get a list of time strings to pass into a dictionary later on
var monList = ee.List.sequence(0, nMonths,3).map(function (n) {
              return start.advance(n, 'month').format('YYYMMdd')})
print('monList', monList)



var result = mun.map(function(feature){
  // map over each month
  var timeSeries = ee.List.sequence(0, nMonths,3).map(function (n){
    // calculate the offset from startDate
    var ini = start.advance(n,'month');
    // advance just one month
    var end = ini.advance(3,'month');
    // filter and reduce
    var data = l89.filterDate(ini,end).mean().reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: feature.geometry(),
      scale: 30})
    return data})
  var classes = timeSeries.map(function(d) {
      return ee.Dictionary(d).get('ST_B10')})
  var timeDict = ee.Dictionary.fromLists(monList, classes)
  return feature.set(timeDict);
});

print(result.limit(3));

var start_name = start.format('YYYY_MM').getInfo()
var end_name = end.format('YYYY_MM').getInfo()



Export.table.toDrive({
  collection: result,
  description: 'LST_'+ start_name + '_' + end_name,
  fileFormat: 'CSV'
 });

///________FUNCTIONS______________
// Cloud Mask function (CFMask) 
function cloudmask(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask)}

// Applies scaling factors.
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0)
                     .subtract(273.15); // Scale factor for degrees Celsius;
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true)}


