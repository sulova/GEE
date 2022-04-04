var s2_20150809T103438 = ee.Image('COPERNICUS/S2/20150809T103438_20160715T140410_T32UME').select(['B4', 'B3', 'B2']);
var s2_20160826T104022 = ee.Image('COPERNICUS/S2/20160826T104022_20160826T104023_T32UME').select(['B4', 'B3', 'B2']);
var s2_20160925T104022 = ee.Image('COPERNICUS/S2/20160925T104022_20160925T104115_T32UME').select(['B4', 'B3', 'B2']);
var s2_20180520T103019 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20180520T103019_20180520T103458_T32UME').select(['B4', 'B3', 'B2']);;
var s2_20180806T104021 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20180806T104021_20180806T104340_T32UME').select(['B4', 'B3', 'B2']);;
var s2_20200529T102559 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20200529T102559_20200529T103145_T32UME').select(['B4', 'B3', 'B2']);;
var s2_20200601T103629 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20200601T103629_20200601T104439_T32UME').select(['B4', 'B3', 'B2']);;
var s2_20201108T104249 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20201108T104249_20201108T104243_T32UME').select(['B4', 'B3', 'B2']);;
var s2_20210305T102809 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20210305T102809_20210305T103123_T32UME').select(['B4', 'B3', 'B2']);;
var s2_20220325T102651 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20220325T102651_20220325T103203_T32UME').select(['B4', 'B3', 'B2']);;

var s2_20150809T103438 = s2_20150809T103438 .clip(geometry);
var s2_20160826T104022 = s2_20160826T104022 .clip(geometry);
var s2_20160925T104022 = s2_20160925T104022 .clip(geometry);
var s2_20180520T103019 = s2_20180520T103019 .clip(geometry);
var s2_20180806T104021 = s2_20180806T104021 .clip(geometry);
var s2_20200529T102559 = s2_20200529T102559 .clip(geometry);
var s2_20200601T103629 = s2_20200601T103629 .clip(geometry);
var s2_20201108T104249 = s2_20201108T104249 .clip(geometry);
var s2_20210305T102809 = s2_20210305T102809 .clip(geometry);
var s2_20220325T102651 = s2_20220325T102651 .clip(geometry);

var rgbVis = {min:0, max:3000, bands: ['B4', 'B3', 'B2']};

Map.addLayer(s2_20150809T103438, rgbVis, "s2_20150809T103438",0)
Map.addLayer(s2_20160826T104022, rgbVis, "s2_20160826T104022",0)
Map.addLayer(s2_20160925T104022, rgbVis, "s2_20160925T104022",0)
Map.addLayer(s2_20180520T103019, rgbVis, "s2_20180520T103019",0)
Map.addLayer(s2_20180806T104021, rgbVis, "s2_20180806T104021",0)
Map.addLayer(s2_20200529T102559, rgbVis, "s2_20200529T102559",0)
Map.addLayer(s2_20200601T103629, rgbVis, "s2_20200601T103629",0)
Map.addLayer(s2_20201108T104249, rgbVis, "s2_20201108T104249",0)
Map.addLayer(s2_20210305T102809, rgbVis, "s2_20220318T103751",0)
Map.addLayer(s2_20220325T102651, rgbVis, "s2_20220318T103751",0)


Export.image.toDrive({  image: s2_20150809T103438.select("B4", "B3", "B2"),
  description: 's2_20150809T103438',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: s2_20160826T104022.select("B4", "B3", "B2"),
  description: 's2_20160826T104022',  scale: 10,  region: geometry}); 
Export.image.toDrive({  image: s2_20160925T104022.select("B4", "B3", "B2"),
  description: 's2_20160925T104022',  scale: 10,  region: geometry}); 
Export.image.toDrive({  image: s2_20220325T102651.select("B4", "B3", "B2"),
  description: 's2_20220325T102651_H',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: s2_20210305T102809.select("B4", "B3", "B2"),
  description: 's2_20210305T102809_H',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: s2_20201108T104249.select("B4", "B3", "B2"),
  description: 's2_20201108T104249_H',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: s2_20200601T103629.select("B4", "B3", "B2"),
  description: 's2_20200601T103629_H',  scale: 10, region: geometry});    
Export.image.toDrive({  image: s2_20200529T102559.select("B4", "B3", "B2"),
  description: 's2_20200529T102559_H',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: s2_20180806T104021.select("B4", "B3", "B2"),
  description: 's2_20180806T104021_H',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: s2_20180520T103019.select("B4", "B3", "B2"),
  description: 's2_20180520T103019_H',  scale: 10,  region: geometry});    

Map.centerObject(s2_20180520T103019, 10);


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
    return targetValues.get(index)
  })
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
    sourceImg.select(['B2']).interpolate(lookup(source.getArray('B2'), target.getArray('B2')))
  )
}

var match_s2_20150809T103438 = histogramMatch(s2_20150809T103438, s2_20180806T104021)
var match_s2_20160826T104022 = histogramMatch(s2_20160826T104022, s2_20180806T104021)
var match_s2_20160925T104022 = histogramMatch(s2_20160925T104022, s2_20180806T104021)
var match_s2_20180520T103019 = histogramMatch(s2_20180520T103019, s2_20180806T104021)
var match_s2_20180806T104021 = histogramMatch(s2_20180806T104021, s2_20180806T104021)
var match_s2_20200529T102559 = histogramMatch(s2_20200529T102559, s2_20180806T104021)
var match_s2_20200601T103629 = histogramMatch(s2_20200601T103629, s2_20180806T104021)
var match_s2_20201108T104249 = histogramMatch(s2_20201108T104249, s2_20180806T104021)
var match_s2_20210305T102809 = histogramMatch(s2_20210305T102809, s2_20180806T104021)
var match_s2_20220325T102651 = histogramMatch(s2_20220325T102651, s2_20180806T104021)



Map.addLayer(match_s2_20150809T103438, rgbVis, 'match_s2_20150809T103438')
Map.addLayer(match_s2_20160826T104022, rgbVis, 'match_s2_20160826T104022')
Map.addLayer(match_s2_20160925T104022, rgbVis, 'match_s2_20150809T103438')
Map.addLayer(match_s2_20180520T103019, rgbVis, 'match_s2_20180520T103019')
Map.addLayer(match_s2_20180806T104021, rgbVis, 'match_s2_20180806T104021')
Map.addLayer(match_s2_20200529T102559, rgbVis, 'match_s2_20200529T102559')
Map.addLayer(match_s2_20200601T103629, rgbVis, 'match_s2_20200601T103629')
Map.addLayer(match_s2_20201108T104249, rgbVis, 'match_s2_20201108T104249')
Map.addLayer(match_s2_20210305T102809, rgbVis, 'match_s2_20210305T102809')
Map.addLayer(match_s2_20220325T102651, rgbVis, 'match_s2_20220325T102651')

var thumbParams = {dimensions: 1000}

var match_s2_20150809T103438 = match_s2_20150809T103438.visualize(rgbVis)
print(match_s2_20150809T103438)
print(match_s2_20150809T103438.clip(geometry).getThumbURL(thumbParams))
var match_s2_20160826T104022 = match_s2_20160826T104022.visualize(rgbVis)
print(match_s2_20160826T104022.clip(geometry).getThumbURL(thumbParams))
var match_s2_20160925T104022 = match_s2_20160925T104022.visualize(rgbVis)
print(match_s2_20160925T104022.clip(geometry).getThumbURL(thumbParams))
var match_s2_20180520T103019 = match_s2_20180520T103019.visualize(rgbVis)
print(match_s2_20180520T103019.clip(geometry).getThumbURL(thumbParams))
var match_s2_20180806T104021 = match_s2_20180806T104021.visualize(rgbVis)
print(match_s2_20180806T104021.clip(geometry).getThumbURL(thumbParams))
var match_s2_20200529T102559 = match_s2_20200529T102559.visualize(rgbVis)
print(match_s2_20200529T102559.clip(geometry).getThumbURL(thumbParams))
var match_s2_20200601T103629 = match_s2_20200601T103629.visualize(rgbVis)
print(match_s2_20200601T103629.clip(geometry).getThumbURL(thumbParams))
var match_s2_20201108T104249 = match_s2_20201108T104249.visualize(rgbVis)
print(match_s2_20201108T104249.clip(geometry).getThumbURL(thumbParams))
var match_s2_20210305T102809 = match_s2_20210305T102809.visualize(rgbVis)
print(match_s2_20210305T102809.clip(geometry).getThumbURL(thumbParams))
var match_s2_20220325T102651 = match_s2_20220325T102651.visualize(rgbVis)
print(match_s2_20220325T102651.clip(geometry).getThumbURL(thumbParams))


Export.image.toDrive({  image: match_s2_20150809T103438,
  description: 'match_s2_20150809T103438',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: match_s2_20160826T104022,
  description: 'match_s2_20160826T104022',  scale: 10,  region: geometry}); 
Export.image.toDrive({  image: match_s2_20160925T104022,
  description: 'match_s2_20160925T104022',  scale: 10,  region: geometry}); 
Export.image.toDrive({  image: match_s2_20180520T103019,
  description: 'match_s2_20180520T103019',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: match_s2_20180806T104021,
  description: 'match_s2_20180806T104021',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: match_s2_20200529T102559,
  description: 'match_s2_20200529T102559',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: match_s2_20200601T103629,
  description: 'match_s2_20200601T103629',  scale: 10, region: geometry});    
Export.image.toDrive({  image: match_s2_20201108T104249,
  description: 'match_s2_20201108T104249',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: match_s2_20210305T102809,
  description: 'match_s2_20210305T102809',  scale: 10,  region: geometry});    
Export.image.toDrive({  image: match_s2_20220325T102651,
  description: 'match_s2_20220325T102651',  scale: 10,  region: geometry});    
