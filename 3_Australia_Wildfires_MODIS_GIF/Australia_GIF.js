// Define the regional bounds of animation frames.
var region= ee.Geometry.Polygon(
  [[[112.57343749999998,-43.94165599174539], 
  [153.70624999999998,-43.94165599174539], 
  [153.70624999999998,-9.151781283740655],
  [112.57343749999998,-9.151781283740655]]], null,false);

// Paint country feature edges to the empty image.
var Australia = ee.FeatureCollection("USDOS/LSIB/2013").filterMetadata("cc","equals","AS")
Map.setCenter(153.02, -27.47, 9);
Map.centerObject(Australia)

// Define a collection
var col = ee.ImageCollection('MODIS/006/MCD64A1')
  .filterDate('2019-07-01', '2020-02-29').select('BurnDate').filterBounds(region);
var visParams = {min: 0.0, max: 366, palette: ['FF0000','#ff6666']};

// Define GIF visualization parameters.
var gifParams = {'region': region,'dimensions': 900,
  'crs': 'EPSG:3857','framesPerSecond': 0.7,'format': 'gif'};

var Palet = ['aec3d4', '111149','d7cdcc', '6f6f6f','white'];

var dataset = ee.Image('USGS/SRTMGL1_003');
var elevation= dataset.select('elevation').clip(Australia);
var elevation2 = elevation.visualize ({min: 0, max: 800, palette:Palet});

//var empty = ee.Image().byte();
//var Australia_style = empty.paint({featureCollection: Australia, color: 5, width: 1}).visualize({palette: '777777'});
//var rgbVis = col.map(function(img) {return elevation2.blend(img.visualize(visParams))});
//print(rgbVis.getVideoThumbURL(gifParams));

var dataset = ee.Image('USGS/SRTMGL1_003');
var elevation= dataset.select('elevation').clip(Australia);
var elevation2 = elevation.visualize ({min: 0, max: 1000, palette:Palet});

//Map.addLayer(elevation2);
//var empty = ee.Image().byte();
//var Australia_style = empty
  //.paint({featureCollection: Australia, color: 5, width: 1})
  // Convert to an RGB visualization image; set line color to black.
 // .visualize({palette: '777777'});
  
//_______TIME STAMP_______________________
var text = require('users/gena/packages:text')
var pt = text.getLocation(region, 'left', '2%', '5%')

col = col.map(function(img) {
  var doy = ee.Date(img.get('system:time_start')).getRelative('day', 'year');
  return img.set('doy', doy);});

// Get a collection of distinct images by 'doy'.
var distinctDOY = col.filterDate('2019-05-01', '2020-02-29');

// collection match the DOY from the distinct DOY collection.
var filter = ee.Filter.equals({leftField: 'doy', rightField: 'doy'});
var join = ee.Join.saveAll('doy_matches');
var joinCol = ee.ImageCollection(join.apply(distinctDOY, col, filter));

// Apply median reduction among matching DOY collections.
var comp = joinCol.map(function(img) {
  var doyCol = ee.ImageCollection.fromImages(
    img.get('doy_matches')
  );
  return doyCol.reduce(ee.Reducer.median())
    .copyProperties(img, ['system:time_start']);});

// Create RGB visualization images for use as animation frames.
var rgbVis = comp.map(function(img) {
  var scale = 5000
  var textVis = { fontSize: 32, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2.5, outlineOpacity: 0.6 }
  var label = text.draw(img.get('system:index'), pt, scale, textVis)
  return elevation2.blend(img.visualize(visParams)).blend(label)});

//____END TIME STAMP__________

//var rgbVis = col.map(function(img) {return elevation2.blend(img.visualize(visParams))});
//Map.addLayer(rgbVis.first())

print(rgbVis.getVideoThumbURL(gifParams));
print(ui.Thumbnail(rgbVis, gifParams));

//____________EXPORT_________

Export.image.toDrive({
  image:  ee.Image(col.select('population').first()),
  description: 'imageToDriveExample',
  scale: 500,
  region: region
});

