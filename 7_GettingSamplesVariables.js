//___________GEDI______________
var aoi = ee.Geometry.Polygon([[[-2.9, 39.01],[-2.89, 36.6],[0.07, 36.6],[0.08, 39.01]]]);
var samples = ee.FeatureCollection('projects/geo4gras/assets/rio-segura/gedi-perm-refl')

//Class
var classes = samples.aggregate_array('label').distinct()
var classes_T = samples.aggregate_array('Seasons_T').distinct()
print("classes", classes, classes_T, samples.aggregate_histogram('Seasons_T')) 

//___________PALSAR__25m__________
var SAR20_HH = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HH").filterBounds(aoi)
                .filter(ee.Filter.date('2020-01-01', '2020-12-31')).aside(print).reduce(ee.Reducer.median()).rename("SAR20_HH")
var SAR20_HV = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HV").filterBounds(aoi)
                .filter(ee.Filter.date('2020-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR20_HV")             
var SAR1520_HH = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HH").filterBounds(aoi)
                .filter(ee.Filter.date('2015-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR1520_HH");  
var SAR1520_HV = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HV").filterBounds(aoi)
                .filter(ee.Filter.date('2015-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR1520_HV");
                 
//___________DM__5m/30m_______________
var GLO30 = ee.ImageCollection("projects/sat-io/open-datasets/GLO-30").filterBounds(aoi).mosaic().rename("GLO30")
var DSM05 = ee.Image("projects/geo4gras/assets/rio-segura/DSM05").rename("DSM05");
var DTM05 = ee.Image("projects/geo4gras/assets/rio-segura/DTM05").rename("DTM05");
var dif_DM05 = DSM05.subtract(DTM05).rename("dif_DM05");
var dif_DM30 = GLO30.subtract(DTM05).rename("dif_GLO30");
var slope = ee.Terrain.slope(DTM05).rename("Slope_DTM05")
var aspect = ee.Terrain.aspect(DTM05).rename("Aspect_DTM05")

//SmoothRaster
var boxcar_3 = ee.Kernel.square({radius: 3, units: 'pixels', magnitude: 1});
var DTM05_SM3 = DTM05.convolve(boxcar_3).rename("DTM05_SM3");
var Slope_SM3 = slope.convolve(boxcar_3).rename("Slope_SM3");
var boxcar_5 = ee.Kernel.square({radius: 5, units: 'pixels', magnitude: 1});
var DTM05_SM5 = DTM05.convolve(boxcar_5).rename("DTM05_SM5");
var Slope_SM5 = slope.convolve(boxcar_5).rename("Slope_SM5");
var boxcar_10 = ee.Kernel.square({radius: 10, units: 'pixels', magnitude: 1});
var DTM05_SM10 = DTM05.convolve(boxcar_10).rename("DTM05_SM10");
var Slope_SM10= slope.convolve(boxcar_10).rename("Slope_SM10");

//____________S1____________________
var label = ee.Image("projects/ee-sulovaandrea/assets/Segura/perm_rasterized").rename("Label");
var S1_VH = ee.ImageCollection("projects/sat-io/open-datasets/S1GBM/normalized_s1_backscatter_VH").first().rename("S1VH");
var S1_VV = ee.ImageCollection("projects/sat-io/open-datasets/S1GBM/normalized_s1_backscatter_VV").first().rename("S1VV");

//____________HAND_______________________
var hand30 = ee.ImageCollection("users/gena/global-hand/hand-100").mosaic().rename("HAND30")

//______Merge Laye______________
var layer = SAR20_HH.addBands(SAR20_HV).addBands(SAR1520_HH).addBands(SAR1520_HV).addBands(GLO30).addBands(DSM05)
            .addBands(DTM05).addBands(dif_DM05).addBands(dif_DM30).addBands(slope).addBands(aspect)
            .addBands(label).addBands(S1_VH).addBands(S1_VV).addBands(hand30).addBands(DTM05_SM3)
            .addBands(Slope_SM3).addBands(DTM05_SM5).addBands(Slope_SM5).addBands(DTM05_SM10).addBands(Slope_SM10)
            
print("Name of bands", layer)

// var band_Names = samples.first().propertyNames().removeAll(["year","Training","Superficie","Seasons_T","system:index","beam","TreeType_T","month","B1_p10","B1_p20","B1_p50","B1_p90","B1_p95","B9_p10","B9_p20","B9_p50","B9_p90","B9_p95"])
var band_Names = samples.first().propertyNames().removeAll(["year","Training","Superficie","Seasons_T",
                                 "system:index","beam","TreeType_T","month","B1_p10","B1_p20","B1_p50",
                                 "B1_p90","B1_p95","B9_p10","B9_p20","B9_p50","B9_p90","B9_p95",
                                 "B10_p10","B10_p20","B10_p50","B10_p90","B10_p95",])

var samples = samples.select(band_Names)  


//___Export Samples____10/20m___________
var training = layer.reduceRegions({collection:samples, reducer:ee.Reducer.mean(), scale:20, tileScale:10})
Export.table.toAsset({collection:training, description:"GEDI_var21_20", assetId:"Segura"})

var training = layer.reduceRegions({collection:samples, reducer:ee.Reducer.mean(), scale:10, tileScale:10})
Export.table.toAsset({collection:training, description:"GEDI_var21_10", assetId:"Segura"})

print("Samples before", training.first())


//____MAPs_______
Map.addLayer(label, {min: 1,  max: 9, palette: ['FCFDBF', 'FDAE78', 'EE605E', 'B63679', '711F81', '2C105C']},"label",0)
Map.addLayer(Slope_SM5, {min: 0, max: 256}, 'Slope_SM5',0 );
Map.addLayer(DTM05_SM5, {min: 0, max: 256}, 'DTM05_SM5',0);







;
