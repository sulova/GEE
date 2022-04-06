var geometry = ee.Geometry.Polygon([[[7.97233427942289, 53.97207856298764],[7.97233427942289, 53.600488504021016],
                                [8.74687041223539, 53.600488504021016],[8.74687041223539, 53.97207856298764]]], null, false);

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

// Target Image
var image_target = s2_5.select(['B4', 'B3', 'B2'])


var thumbParams = {dimensions: 1000}
var collection = ee.ImageCollection([s2_1, s2_2, s2_3, s2_4, s2_5, s2_6, s2_7, s2_8, s2_9, s2_10])            
var collection_list = collection.toList(collection.size());
var collection_size = collection.size()
var rgbVis = {min:0, max:3000, bands: ['B4', 'B3', 'B2']};
Map.centerObject(s2_1, 10);

//___________________Function______________________________

// Create a lookup table to make sourceHist match targetHist.
var lookup = function(sourceHist, targetHist) {
  // Split the histograms by column and normalize the counts.
  var sourceValues = sourceHist.slice(1, 0, 1).project([0])
  var sourceCounts = sourceHist.slice(1, 1, 2).project([0])
  sourceCounts = sourceCounts.divide(sourceCounts.get([-1]))

  var targetValues = targetHist.slice(1, 0, 1).project([0])
  var targetCounts = targetHist.slice(1, 1, 2).project([0])
  targetCounts = targetCounts.divide(targetCounts.get([-1]))

  // Find first position in target where targetCount >= srcCount[i], for each i.
  var lookup = sourceCounts.toList().map(function(n) {
    var index = targetCounts.gte(n).argmax()
    return targetValues.get(index)})
  return {x: sourceValues.toList(), y: lookup}
}

// Make the histogram of sourceImg match targetImg.
var histogramMatch = function(sourceImg, targetImg) {
  var geom = sourceImg.geometry();
  var args = {
    reducer: ee.Reducer.autoHistogram({maxBuckets: 256, cumulative: true}), 
    geometry: geometry,
    scale: 10, // Need to specify a scale, but it doesn't matter what it is because bestEffort is true.
    maxPixels: 65536 * 4 - 1,
    bestEffort: true}
  
  // Only use pixels in target that have a value in source (inside the footprint and unmasked).
  var source = sourceImg.reduceRegion(args)
  var target = targetImg.updateMask(sourceImg.mask()).reduceRegion(args)

  return ee.Image.cat(
    sourceImg.select(['B4']).interpolate(lookup(source.getArray('B4'), target.getArray('B4'))),
    sourceImg.select(['B3']).interpolate(lookup(source.getArray('B3'), target.getArray('B3'))),
    sourceImg.select(['B2']).interpolate(lookup(source.getArray('B2'), target.getArray('B2'))))
}

// Loop for visualization, match bands and downloading images

for(var i = 0; i < collection_size.getInfo(); i++){
  var image = ee.Image(collection_list.get(i)).select(['B4', 'B3', 'B2']);
  var date = image.date().format('yyyy-MM-dd').getInfo()
  var image_match = histogramMatch(image,image_target)
  
  Map.addLayer(image, rgbVis, i.toString() +"_S2_"+ date.toString(), true)
  Map.addLayer(image_match, rgbVis, i.toString() +"_S2_match_"+ date.toString(), true)
  
  Export.image.toDrive({  
    image: image.select("B4", "B3", "B2"),
    description: i.toString() +"_S2_"+ date.toString(),
    scale: 10,  
    region: geometry})
    
  var image_vis = image_match.visualize(rgbVis).clip(geometry)
  
  Export.image.toDrive({  
    image: image_vis,
    description: i.toString() +"_S2_match_"+ date.toString(),
    scale: 10,  
    region: geometry})
  
  //print(image_vis.getThumbURL(thumbParams))  
  }
  


