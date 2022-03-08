/*
Name:Andrea Sulova  
Date: 2022 March 03
Objectives: Multitemporal SDB
*/

//------------------- I N P U T S ------------------------/

var date_start = '2022-01-29'
var date_end = '2022-01-30'
var S2_SR_cloud_scene = 50

// lower number more masked pixels
var S2_CP_cloud_pixel = 40


var geometry = ee.Geometry.Polygon(
        [[[37.09795368708345, 21.108338438453522],
          [37.09795368708345, 21.010619044230847],
          [37.14258564509126, 21.010619044230847],
          [37.14258564509126, 21.108338438453522]]], null, false);
          

Map.centerObject(geometry, 12)
//Map.setOptions('HYBRID')   

//------------------- F U N C T I O N S ----------------------

// Land Mask  
function landmask(image) {
  return  image.updateMask(image.select('SCL').eq(6))};
  
  
function maskClouds(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(S2_CP_cloud_pixel);
  return img.updateMask(isNotCloud);}

// The masks for the 10m bands sometimes do not exclude bad data at
// scene edges, so we apply masks from the 20m and 60m bands as well.

function maskEdges(s2_img) {
  return s2_img.updateMask(
      s2_img.select('B8A').mask().updateMask(s2_img.select('B9').mask()));}

// Slider helping go through scenes
var slider = ui.Slider();
slider.onSlide(function(value) {
  var int_value = value * (Map.layers().length() - 1) >> 0;
  Map.layers().get(int_value).setOpacity(1);
  for (var i = int_value + 1; i < Map.layers().length(); i++) {
    Map.layers().get(i).setOpacity(0);}});

print(slider) 


//------------------- S2 -----------------------------------

// Sentinel-2 L2 data are downloaded from scihub. 
// They were computed by running sen2cor.
// WARNING: ESA did not produce L2 data for all L1 assets

var S2_SR = ee.ImageCollection('COPERNICUS/S2_SR')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_SR_cloud_scene))
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
print('S2_SR',S2_SR)
        
var S2_CP = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
                .filterDate(date_start, date_end)
                .filterBounds(geometry);
print("S2_CLOUD_PROBABILITY",S2_CP)

//------ S2  SR ----------------------

// Display each image in collection  
var list_S2_SR = S2_SR.toList(S2_SR.size());
var size_SR = S2_SR.size()
var visParams = {bands:["B4","B3","B2"],min:0,max:3000, gamma:1.5}; 

for(var i = 0; i < size_SR.getInfo(); i++){
  var image = ee.Image(list_S2_SR.get(i));
  var image = image.clip(geometry);
  Map.addLayer(image, visParams, i.toString()+"_S2_SR")
  }
  
//------ S2  CP   V I S U A L I Z A T I O N----------------------

// Display each image in collection  
var list_S2_CP = S2_CP.toList(S2_CP.size());
var size_CP = S2_CP.size()
var vis_S2_CP = {min:0,max:100, gamma:1.5}; 

for(var i = 0; i < size_CP.getInfo(); i++){
  var image = ee.Image(list_S2_CP.get(i));
  var image = image.clip(geometry);
  Map.addLayer(image, vis_S2_CP, i.toString()+"_S2_CP")}
 

//------ S2  Mask   V I S U A L I Z A T I O N----------------------

// Join S2 SR with cloud probability dataset to add cloud mask.
var s2SrWithCloudMask = ee.Join.saveFirst('cloud_mask').apply({
  primary: S2_SR,
  secondary: S2_CP,
  condition:ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})});

var s2CloudMasked = ee.ImageCollection(s2SrWithCloudMask).map(maskClouds).map(landmask);
var size = s2SrWithCloudMask.size()

// Display each image in collection  
var listOfImages = s2CloudMasked.toList(s2CloudMasked.size());

var visParams = {bands:["B4","B3","B2"],min:0,max:2000, gamma:1}; 

for(var i = 0; i < size.getInfo(); i++){
  var image = ee.Image(listOfImages.get(i));
  var image = image.clip(geometry);
  Map.addLayer(image, visParams, i.toString()+"_mask")}

