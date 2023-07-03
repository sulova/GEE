/* Define the study area

Salinity mapping: We need Enhanced Vegetation Index products from the pre monsoon period 
between February and May when soil salinity levels are expected to peak. As an add on to this product, 
we promised to do a linear regression analysis to identify rates of change and dynamics from year to year,
in production patterns which could be attributed to salinity intrusion. Again, we should have products in 10 m resolution 
for each year between 2017-2022. 
The task is described in section 2.2.3 and the aoi for both tasks is attached (aoi_RFP31).
*/

var geometry = ee.FeatureCollection("users/duroskap/AOI_irrigation");

//Function
var maskcloud = function(image) {
  var QA60 = image.select(['QA60']);
  var clouds = QA60.bitwiseAnd(1<<10).or(QA60.bitwiseAnd(1<<11));// this gives us cloudy pixels
  return image.updateMask(clouds.not()); // remove the clouds from image
};
var calculateEVI = function(image) {
  var evi = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': image.select('B8'),
      'RED': image.select('B4'),
      'BLUE': image.select('B2')
    }).multiply(100).rename('EVI');
  return image.addBands(evi);
};


// Define the start and end years for the iteration
var startYear = 2017;
var endYear = 2022;

// Add the RGB composite to the map.
var rgbVis = {min: 0, max: 2500};
var eviVis = { min: -100, max: 100, palette: ['green',  'yellow']};

// Loop over the years
for (var year = startYear; year <= endYear; year++) {
  print(year)
  // Define the start and end dates for the year
  var startDate = ee.Date(year + '-02-01');
  var endDate = ee.Date(year + '-05-30');

  // Filter the Sentinel-2 image collection
  var collection = ee.ImageCollection('COPERNICUS/S2')
                  .filterBounds(geometry)
                  .filterDate(startDate, endDate)
                  .select(['B2','B3','B4', 'B8','QA60'])
                  .filterMetadata('CLOUDY_PIXEL_PERCENTAGE','less_than', 10)
                 
   
  print('no. of S2 images', collection);
  
  var rgbComposite = collection.map(maskcloud).select('B4','B3','B2').median().clip(geometry).round()
  Map.addLayer(rgbComposite, rgbVis, 'S2_'+ startDate.get('year').getInfo().toString());
                  
  var eviSeasonal = collection.map(maskcloud).map(calculateEVI).select('EVI').median().clip(geometry).round()
  Map.addLayer(eviSeasonal, eviVis, 'EVI'+ startDate.get('year').getInfo().toString());
  
  var eviSeasonal_smooth = eviSeasonal.focal_median({radius: 2, units: 'pixels'});
  Map.addLayer(eviSeasonal_smooth, eviVis, 'Smooth EVI'+ startDate.get('year').getInfo().toString());

  Export.image.toDrive({
    image: eviSeasonal.int8(),
    description: 'EVI_' + ee.Date(startDate).get('year').getInfo().toString(),
    region: geometry, 
    folder:'EO_EVI',
    scale: 10,
    maxPixels: 10e12,
    shardSize: 256,  //shardSize: 1024,
    fileDimensions: 256*2*10*10,
    formatOptions: {cloudOptimized:true},
    crs: 'EPSG:4326'})
    
  Export.image.toDrive({
    image: eviSeasonal_smooth.int8(),
    description: 'EVI_smooth_' + ee.Date(startDate).get('year').getInfo().toString(),
    region: geometry, 
    folder:'EO_EVI',
    scale: 10,
    maxPixels: 10e12,
    shardSize: 256,  //shardSize: 1024,
    fileDimensions: 256*2*10*10,
    formatOptions: {cloudOptimized:true},
    crs: 'EPSG:4326'})
    
}


