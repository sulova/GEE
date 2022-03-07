/*
Name:Andrea Sulova
Date: 2022 March 03
Objectives: Multitemporal SDB
*/

//------------------- I N P U T S ------------------------/

var date_start = '2021-12-01'
var date_end = '2022-01-20'
var cloud_percent = 40

var geometry = ee.Geometry.Polygon([[[37.025169263255, 21.250398927417418],
          [37.025169263255, 20.927508858890256],[37.32180012263, 20.927508858890256],
          [37.32180012263, 21.250398927417418]]], null, false);
          
Map.centerObject(geometry, 11)
Map.setOptions('HYBRID')   

//------------------- F U N C T I O N S ----------------------

// Cloud Mask
function maskS2clouds(image) {
  var qa = image.select('QA60');
  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = Math.pow(2, 10);
  var cirrusBitMask = Math.pow(2, 11);
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);}
//    

// Land Mask  
function landmask(image) {
  return  image.updateMask(image.select('SCL').eq(6))};


// Slider helping go through scenes
var slider = ui.Slider();
slider.onSlide(function(value) {
  var int_value = value * (Map.layers().length() - 1) >> 0;
  Map.layers().get(int_value).setOpacity(1);
  for (var i = int_value + 1; i < Map.layers().length(); i++) {
    Map.layers().get(i).setOpacity(0);}});

print(slider)

//-------------------S2 --------------------------]
// Sentinel-2 L2 data are downloaded from scihub. 
// They were computed by running sen2cor.
// WARNING: ESA did not produce L2 data for all L1 assets

var S2_composite = ee.ImageCollection('COPERNICUS/S2_SR')
                  .filterDate(date_start, date_end)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',cloud_percent))
                  .filterBounds(geometry)
                  .map(maskS2clouds)
                  //.map(landmask)
                  
print(S2_composite)
                 
var dates = ee.List(S2_composite.aggregate_array("system:index")).map(function(d){return d});
print('Number of images in collection:',S2_composite.size(), dates);


// display each image in collection  

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

  
// client side loop
var listOfImages = S2_composite.toList(S2_composite.size());

for(var i = 0; i < 7; i++){
  var image = ee.Image(listOfImages.get(i));
  print(image)
  Map.addLayer(image, visParams, i.toString())
}



//ratio
/*
var B2_B11 = resamp_img.select('B2').divide(resamp_img.select('B11'));
var ratio_image = resamp_img.addBands(B2_B11);

*/ 
