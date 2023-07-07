/* Define the study area
creator: Andrea Sulova
project: EO clinic

Salinity mapping: We need Enhanced Vegetation Index products from the pre monsoon period 
between February and May when soil salinity levels are expected to peak. As an add on to this product, 
we promised to do a linear regression analysis to identify rates of change and dynamics from year to year,
in production patterns which could be attributed to salinity intrusion. 
Again, we should have products in 10 m resolution for each year between 2017-2022. 
The task is described in section 2.2.3 and the aoi for both tasks is attached (aoi_RFP31).

*/

var geometry = ee.FeatureCollection("users/duroskap/AOI_irrigation"); 
Map.centerObject(geometry, 15)

// Define the start and end years for the iteration
var startYear = 2017;
var endYear = 2022;

// Palettes
var rgbVis = {min: 0, max: 2500}
var eviVis = { min: -100, max: 100, palette: ['green',  'yellow']}
var red_blue = ['#ca0020','#f4a582','#f7f7f7','#92c5de','#0571b0']

//Functions
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

var calculateNDWI = function(image) {
  var ndvi = image.normalizedDifference(['B3', 'B8']).multiply(100).rename('ndwi').round();
  return image.addBands(ndvi);
};

function MMU (img, n){
  var patches = img.gte(0).connectedPixelCount(256, true)
  return img.updateMask(patches.gte(n))}

function erode(img, distance) {
  var d = (img.not().unmask(1)
      .fastDistanceTransform(30).sqrt()
      .multiply(ee.Image.pixelArea().sqrt()))
  return img.updateMask(d.gt(distance))
}

function dilate(img, distance) {
  var d = (img.fastDistanceTransform(30).sqrt()
      .multiply(ee.Image.pixelArea().sqrt()))
  return d.lt(distance)
}


// Empty image collection created to store seasonal composites.
var collection = ee.ImageCollection([]);

// Seasonal Median composite from 2017 to 2022--> 6 images in collection 
for (var year = startYear; year <= endYear; year++){
  
  // February and May when soil salinity levels are expected to peak
  var s = ee.Date.fromYMD(year, 02, 01)
  var e = s.advance(3, 'month')
  
  // Crate the seasonal collection
  var images_season = ee.ImageCollection('COPERNICUS/S2')
                  .filterBounds(geometry)
                  .select(['B2','B3','B4', 'B8','QA60'])
                  .filterMetadata('CLOUDY_PIXEL_PERCENTAGE','less_than', 10)
                  .filterDate(s,e)
                
  // Cloud mask + EVI calculation + adding Time
  var image_median = images_season.map(maskcloud)
                                  .map(calculateEVI)
                                  .map(calculateNDWI)
                                  .median()
                                  .clip(geometry)
  
  // Visualize RGB image                                
  // Map.addLayer(image_median, {'bands': ['B4','B3','B2'], min: 0, max:3000}, 'S2_RGB_' + year, 0)                               
  
  // add year as property for LR                             
  var evi_median = image_median.addBands(year).int16().set('year', year)
                                  
  // Merge each median composite to the collection                                
  var collection = collection.merge(evi_median)}



// Check Collection Size
print('S2 collection:', collection )

// Linear Fit
var linearFit = collection.select(['EVI', 'constant']).reduce(ee.Reducer.linearFit())
Map.addLayer(linearFit, {'bands': ['scale'], min: -0.5, max: 0.5, 'palette': red_blue}, 'Scale', 0)

// Salinity Mask - scale should decrease meaning EVI is decreasing
var salinity_mask = linearFit.select('scale').lte(-0.05)
var salinity_mask = linearFit.updateMask(salinity_mask).multiply(1000).round().select('scale')
Map.addLayer(salinity_mask, {min: -1000, max: 0, 'palette':['red','yellow' ]},'Salinity Mask ', 0)

// Water mask
var water_mask = collection.mean().select('ndwi').gt(10)
Map.addLayer(water_mask.selfMask(), {bands: ['ndwi'], palette:['blue']},'Permanent Water', 0)

// Urban Mask
var landCover = ee.ImageCollection('ESA/WorldCover/v200').first().clip(geometry).updateMask(50);
var urbanMask = landCover.eq(50);
Map.addLayer(urbanMask, {}, 'Landcover',0);

// Masked the salinty mask with the permanent water mask
var final = salinity_mask.updateMask(ee.Image.constant(1).subtract(water_mask))
var final = final.updateMask(ee.Image.constant(1).subtract(urbanMask))


// Dilate + Erode +  Minimum Mapping Unit (MMU)
var final = dilate(final,10)
var final = erode(final,8)
var final = MMU(final, 30).rename('scale')

Map.addLayer(final, {'bands': ['scale'],palette:['red']},'Increasing Risk of Soil Salinity', 0)


// Export the final layer
Export.image.toDrive({
    image: final.selfMask().int8(),
    description: 'EVI_salinity_' + startYear.toString() + '_' + endYear.toString(),
    region: geometry, 
    folder:'EO_salinity',
    scale: 10,
    maxPixels: 10e12,
    shardSize: 256,  //shardSize: 1024,
    fileDimensions: 256*2*10*10,
    formatOptions: {cloudOptimized:true},
    crs: 'EPSG:4326'})


// Classify the raster into low () and high categories
var scale_layer = linearFit.select('scale').mask(final).multiply(-1000).round()
var classifiedLayer = scale_layer.where(scale_layer.gt(300),2).where(scale_layer.lte(300), 1);
Map.addLayer(classifiedLayer, {min: 0, max: 2, palette: ['blue', 'yellow', 'red']}, 'Categorical Layer');

// Export the final layer
Export.image.toDrive({
    image: classifiedLayer.selfMask().int8(),
    description: 'EVI_salinity_classified_' + startYear.toString() + '_' + endYear.toString(),
    region: geometry, 
    folder:'EO_salinity',
    scale: 10,
    maxPixels: 10e12,
    shardSize: 256,  //shardSize: 1024,
    fileDimensions: 256*2*10*10,
    formatOptions: {cloudOptimized:true},
    crs: 'EPSG:4326'})

