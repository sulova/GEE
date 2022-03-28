var s2_20150809T103438 = ee.Image('COPERNICUS/S2/20150809T103438_20160715T140410_T32UME');
var s2_20160826T104022 = ee.Image('COPERNICUS/S2/20160826T104022_20160826T104023_T32UME');
var s2_20160925T104022 = ee.Image('COPERNICUS/S2/20160925T104022_20160925T104115_T32UME');
var s2_20180520T103019 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20180520T103019_20180520T103458_T32UME');
var s2_20180806T104021 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20180806T104021_20180806T104340_T32UME');
var s2_20200529T102559 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20200529T102559_20200529T103145_T32UME');
var s2_20200601T103629 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20200601T103629_20200601T104439_T32UME');
var s2_20201108T104249 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20201108T104249_20201108T104243_T32UME');
var s2_20210305T102809 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20210305T102809_20210305T103123_T32UME');
var s2_20220325T102651 = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20220325T102651_20220325T103203_T32UME');

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

var visred = {bands: ['B8', 'B4', 'B3'], max: 4000}
var rgbVis = {min: 100,  max: 1100, gamma: 1, bands: ['B4', 'B3', 'B2']};


Map.addLayer(s2_20150809T103438, rgbVis, "s2_20180520T103019")
Map.addLayer(s2_20160826T104022, rgbVis, "s2_20180520T103019")
Map.addLayer(s2_20160925T104022, rgbVis, "s2_20180520T103019")
Map.addLayer(s2_20180520T103019, rgbVis, "s2_20180520T103019")
Map.addLayer(s2_20180806T104021, rgbVis, "s2_20180806T104021")
Map.addLayer(s2_20200529T102559, rgbVis, "s2_20200529T102559")
Map.addLayer(s2_20200601T103629, rgbVis, "s2_20200601T103629")
Map.addLayer(s2_20201108T104249, rgbVis, "s2_20201108T104249")
Map.addLayer(s2_20210305T102809, rgbVis, "s2_20220318T103751")
Map.addLayer(s2_20220325T102651, rgbVis, "s2_20220318T103751")



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
  description: 's2_20200601T103629_H',  scale: 10,
  region: geometry});    

Export.image.toDrive({  image: s2_20200529T102559.select("B4", "B3", "B2"),
  description: 's2_20200529T102559_H',  scale: 10,  region: geometry});    
  
Export.image.toDrive({  image: s2_20180806T104021.select("B4", "B3", "B2"),
  description: 's2_20180806T104021_H',  scale: 10,  region: geometry});    

Export.image.toDrive({  image: s2_20180520T103019.select("B4", "B3", "B2"),
  description: 's2_20180520T103019_H',  scale: 10,  region: geometry});    



Map.centerObject(s2_20180520T103019, 12);


