var s2_1 = ee.Image('COPERNICUS/S2/20150809T103438_20160715T140410_T32UME');
var s2_2 = ee.Image('COPERNICUS/S2/20160826T104022_20160826T104023_T32UME');
var s2_3 = ee.Image('COPERNICUS/S2/20160925T104022_20160925T104115_T32UME');
var s2_4 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20180520T103019_20180520T103458_T32UME');
var s2_5 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20180806T104021_20180806T104340_T32UME');
var s2_6 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20200529T102559_20200529T103145_T32UME');
var s2_7 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20200601T103629_20200601T104439_T32UME');
var s2_8 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20201108T104249_20201108T104243_T32UME');
var s2_9 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20210305T102809_20210305T103123_T32UME');
var s2_10 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20220325T102651_20220325T103203_T32UME');

var geometry = ee.Geometry.Polygon([[[7.97233427942289, 53.97207856298764],
          [7.97233427942289, 53.600488504021016],[8.74687041223539, 53.600488504021016],
          [8.74687041223539, 53.97207856298764]]], null, false);
          
Map.centerObject(s2_1, 10);

var collection = ee.ImageCollection([s2_1, s2_2, s2_3, s2_4, s2_5, s2_6, s2_7, s2_8, s2_9, s2_10])            
var collection_list = collection.toList(collection.size());

print(collection)
print(collection_list)

var collection_size = collection.size()
var rgbVis = {min:0, max:3000, bands: ['B4', 'B3', 'B2']};

for(var i = 0; i < collection_size.getInfo(); i++){
  var image = ee.Image(collection_list.get(i));
  var image = image.clip(geometry);
  var date = image.date().format('yyyy-MM-dd').getInfo()
  Map.addLayer(image, rgbVis, i.toString() +"_S2_"+ date.toString(), true)
  Export.image.toDrive({  
    image: image.select("B4", "B3", "B2"),
    description: i.toString() +"_S2_"+ date.toString(),
    scale: 10,  
    region: geometry})
  }




