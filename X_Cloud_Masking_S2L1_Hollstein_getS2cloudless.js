/*
Name:Andrea Sulova  
Date: 2022 March 03
Objectives: Multitemporal SDB
*/

//------------------- I N P U T S ------------------------/

var date_start = '2022-01-01'
var date_end = '2022-01-15'
var S2_SR_cloud_scene = 50
// lower number more masked pixels
var S2_CP_cloud_pixel = 40


var geometry =     ee.Geometry.MultiPolygon(
        [[[[-77.04738372700008, 26.64474501163883],
           [-77.04738372700008, 26.64474501163883],
           [-77.04738372700008, 26.64474501163883],
           [-77.04738372700008, 26.64474501163883]]],
         [[[-77.04429382221493, 26.651802650556455],
           [-77.04429382221493, 26.646893034882286],
           [-77.03845733539852, 26.646893034882286],
           [-77.03845733539852, 26.651802650556455]]],
         [[[-77.1817945432565, 26.714066311039613],
           [-77.1817945432565, 26.536055006771377],
           [-77.01974620341275, 26.536055006771377],
           [-77.01974620341275, 26.714066311039613]]]], null, false),
    table = ee.FeatureCollection("projects/ee-sulovaandrea/assets/icesat2_Bahamas");
  

Map.centerObject(geometry, 12)
//Map.setOptions('HYBRID')   

//------------------- S2 -----------------------------------

var S2 = ee.ImageCollection('COPERNICUS/S2')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_SR_cloud_scene))
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
print('S2',S2)



var S2_SR = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_SR_cloud_scene))
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
print('S2_SR',S2_SR)



var S2_CP = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
                .filterDate(date_start, date_end)
                .filterBounds(geometry);

var s2SrWithCloudMask = ee.Join.saveFirst('cloud_mask').apply({
  primary: S2_CP,
  secondary: S2_SR,
  condition:ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})});

print("S2_CLOUD_PROBABILITY",s2SrWithCloudMask)


//------ S2  SR ----------------------

// Display each image in collection  
var list_S2_SR = S2_SR.toList(S2_SR.size());
var size_SR = S2_SR.size()
var visParams = {bands:["B4","B3","B2"],min:0,max:3000, gamma:1.5}; 

for(var i = 0; i < size_SR.getInfo(); i++){
  var image = ee.Image(list_S2_SR.get(i));
  var image = image.clip(geometry);
  Map.addLayer(image, visParams, i.toString()+"_S2_SR")}


//------ S2 Hollstein mask----------------------

var masks = require('users/fitoprincipe/geetools:cloud_masks')
var hollstein = masks.hollstein_S2(['shadow'])


var masks = require('users/fitoprincipe/geetools:cloud_masks')
var hollstein = masks.hollstein_S2(['shadow'])



function maskEdges(s2_img) {
  return s2_img.updateMask(s2_img.select('B8A').mask()
               .updateMask(s2_img.select('B9').mask()))
               .copyProperties(s2_img);}


function getS2Imgs (bounds, s, e){
  return ee.ImageCollection("COPERNICUS/S2")
           .filter([
             ee.Filter.date(s,e),
             ee.Filter.bounds(bounds),
             ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_SR_cloud_scene),
            // ee.Filter.neq('GENERAL_QUALITY', 'FAILED')
             ])
           .map(maskEdges)}


function directionalMask (img){
  var probability = img.select('probability')
  var cloudMask = probability.lt(0) /// 0: cloud, 1: no cloud

  var isCloud = cloudMask.eq(0).focal_max(10) //.focal_min(2).focal_max(6);
  isCloud = isCloud.reproject({crs: cloudMask.projection(), scale: 250});

  // Project shadows from clouds we found in the last step. This assumes we're working in a UTM projection.
  var shadowAzimuth = ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE')).subtract(90);

  // With the following reproject, the shadows are projected 5km.
  isCloud = isCloud.directionalDistanceTransform(shadowAzimuth, 300);
  isCloud = isCloud.select('distance').mask();
  
  return isCloud//.not()
}


function shadowMask(i){
  var dir = directionalMask(i) // 1: shadow cast, 0: clear skies
  var hol = hollstein(i).select('B1').mask().eq(0) // 1: Hollstein shadow, 0: no shadow
  var both = dir.and(hol) /// 1: Both shadow conditions
  return i.updateMask(both.not()) ///Mask the shadows
}


function getS2cloudless (bounds, s, e){
  var primary = getS2Imgs(bounds, s, e)
  var secondary = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY")
                    .filterBounds(geometry)
                    .filterDate(date_start, date_end)
  print("primary",primary)
  print("secondary",secondary)
  /// join the cloudless collection
  var join = ee.Join.inner()
               .apply(primary, secondary, ee.Filter.equals({leftField:'system:index', rightField:'system:index'}))
               .map(function (j){
                 return ee.Image.cat(j.get('primary'), j.get('secondary'))
                          .set('cloudless', ee.Image(j.get('secondary')).id())
                          .copyProperties(j.get('primary'))
               })
  print("join",join)
  var masked = ee.ImageCollection(join).map(function (img){
    var dateString = img.date().get('month')//.format('%02d')
    var probability = img.select('probability')
    var cloudMask = probability.lt(35)
    var cloudScore = ee.Image(100).subtract(probability).rename('score')

    return ee.Image(shadowMask(img.addBands(probability)))
              .addBands(cloudScore)
              .updateMask(cloudMask.focal_min(3)) // s2cloudless + 3px edges
              .copyProperties(img)
              .set('month', dateString)
    })
  print("masked",masked) 
  return masked
}


var a  = getS2cloudless(geometry, date_start, date_end)
print(a)

// Display each image in collection  
var listOfImages = a.toList(a.size());
var size = a.size()
print(size)
var visParams = {bands:["B4","B3","B2"],min:0,max:2000, gamma:1}; 

for(var i = 0; i < size.getInfo(); i++){
  var image = ee.Image(listOfImages.get(i));
  var image = image.clip(geometry);
  Map.addLayer(image, visParams, i.toString()+"_cloud_mask")}
