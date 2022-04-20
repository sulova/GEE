var aoi = ee.Geometry.Polygon([[[-2.9, 39.01],[-2.89, 36.6],[0.07, 36.6],[0.08, 39.01]]]);
var samples = ee.FeatureCollection('projects/geo4gras/assets/rio-segura/gedi-perm-refl')
var glo30_DSM = ee.ImageCollection("projects/sat-io/open-datasets/GLO-30").filterBounds(aoi)
var DSM05 = ee.Image("projects/geo4gras/assets/rio-segura/DSM05");
var DTM05 = ee.Image("projects/geo4gras/assets/rio-segura/DTM05");
Map.addLayer(glo30_DSM, {min:0,max:2000}, 'glo30_DSM',0);
Map.addLayer(DTM05, {min:0,max:2000}, 'DTM05',0);
Map.addLayer(DSM05, {min:0,max:2000}, 'DSM05',0);
Map.centerObject(aoi)


var diff_ele = DSM05.subtract(DTM05);
var diff_ele = diff_ele.rename("dif_elev")
Map.addLayer(diff_ele, {min:-7,max:20}, 'subtraction',0);


var classes = samples.aggregate_array('label').distinct()
var classes_T = samples.aggregate_array('Seasons_T').distinct()
print("classes", classes, classes_T, samples.aggregate_histogram('Seasons_T')) 


// Generate the histogram data.  Use minBucketWidth for nice sized buckets.
var histogram = ui.Chart.image.histogram({  image: diff_ele,  region: aoi, scale: 30,maxPixels: 1e9, minBucketWidth: 1}); histogram.setOptions({title: 'Histogram of diff ele(meters)'});
print(histogram);


var band_Names = samples.first().propertyNames()
  .removeAll(["year","Training","Superficie","Seasons_T","system:index","beam","TreeType_T","month",
    "B1_p10","B1_p20","B1_p50","B1_p90","B1_p95","B9_p10","B9_p20","B9_p50","B9_p90","B9_p95",])
    
var samples = samples.select(band_Names)  
print(samples.first())  

// Overlay the points on the imagery to get training.
var training = diff_ele.sampleRegions({collection: samples, scale: 30});
var training = training.first()
print(training)

  
// Train a RF classifier.
var rf = ee.Classifier.smileRandomForest({numberOfTrees:200, minLeafPopulation:10})
var rf = rf.train({features:training, classProperty: "label", inputProperties: band_Names})

var imp = ee.Dictionary(rf.explain().get('importance'))
print(imp)  











