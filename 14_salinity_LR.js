/* Define the study area

Salinity mapping: We need Enhanced Vegetation Index products from the pre monsoon period 
between February and May when soil salinity levels are expected to peak. As an add on to this product, 
we promised to do a linear regression analysis to identify rates of change and dynamics from year to year,
in production patterns which could be attributed to salinity intrusion. 
Again, we should have products in 10 m resolution for each year between 2017-2022. 
The task is described in section 2.2.3 and the aoi for both tasks is attached (aoi_RFP31).

*/

var geometry = ee.FeatureCollection("users/duroskap/AOI_irrigation"); 
var point = ee.Geometry.Point( 91.9164492853894, 21.666631267023075); 
Map.centerObject(geometry, 14)

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
var regression_collection = ee.ImageCollection([]);

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
                                  .select('EVI')
                                  .median()
                                  .addBands(year).int16().clip(geometry)
  var image_median = image_median.set('year', year)
                                  
  // Merge each median composite to the collection                                
  var regression_collection = regression_collection.merge(image_median)}

// Check Collection
print('S2 collection:', regression_collection )

// Linear Fit
var linearFit = regression_collection.select(['EVI', 'constant']).reduce(ee.Reducer.linearFit())
Map.addLayer(linearFit, {'bands': ['scale'], min: -0.5, max: 0.5, 'palette': red_blue}, 'Scale', 0)

// Mask  
var change_mask = linearFit.select('scale').lt(-0.1)
var final = linearFit.updateMask(change_mask).multiply(1000).round()
Map.addLayer(final, {'bands': ['scale'], min: -1000, max: 0, 'palette':['red','yellow' ]},'Final ', 1)


// Dilate + Erode +  Minimum Mapping Unit (MMU)
var final_edit = erode(final, 5)
var final_edit = dilate(final_edit,5)
var final_edit = MMU(final_edit, 8).rename('scale')
Map.addLayer(final_edit, {'bands': ['scale'], min: -1000, max: 0, 'palette':['red','yellow' ]},'final_edit ', 1)

/*

// Check EVI timeseries for a point

var valueArray = ee.List([]);
var timeArray = ee.List([]);
var imageList = regression_collection.toList(regression_collection.size())

for (var i = 0; i < imageList.length().getInfo(); i++) {
  var image = ee.Image(imageList.get(i));
  var valueDict = image.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: point,
    scale: 30})
  var valueArray = valueArray.add(valueDict.get('EVI'))
  var timeArray = timeArray.add(valueDict.get('constant'))}
print(valueArray, timeArray)

*/


// Export the final layer
Export.image.toDrive({
    image: final.int8(),
    description: 'EVI_salinity_' + startYear.toString() + '_' + endYear.toString(),
    region: geometry, 
    folder:'EO_EVI',
    scale: 10,
    maxPixels: 10e12,
    shardSize: 256,  //shardSize: 1024,
    fileDimensions: 256*2*10*10,
    formatOptions: {cloudOptimized:true},
    crs: 'EPSG:4326'})



