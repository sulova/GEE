/*

Find Important Variables for Classification

*/
var geometry = ee.Geometry.MultiPoint(
        [[-1.5171839763683659, 37.84347161926997]]);

Map.addLayer(geometry,{},"geometry")


//_____Input Sample Variables__________
var samples = ee.FeatureCollection("projects/ee-sulovaandrea/assets/Segura/GEDI_var21_10");
// var samples = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/GEDI_variables_20_Filter");

Map.centerObject(geometry,14); 

//var samples = samples.limit(1000)


var samples = samples.filter(ee.Filter.lt('rh98',18))

print("Size of training samples:",samples.size())


//_______________Load_Layers______________
var aoi = ee.Geometry.Polygon([[[-2.9, 39.01],[-2.89, 36.6],[0.07, 36.6],[0.08, 39.01]]]);

var b = ['ndvi', 'ndre', 'savi', 'ndmi', 'nbr', 'bi',"B1", "B2", "B3", "B4", "B5", "B6", "B7", 'B12',"B8","B8A" ,"B11"]
var s2 =  getS2('2020-01-01', '2020-12-31')
var s2Q = ee.List.sequence(1,4,1).map(function(m){
  var s = ee.Date.fromYMD(2020, ee.Number(m).multiply(3).subtract(2), 1)
  var e = s.advance(3, 'month')
  var month = s2.filterDate(s,e).select(b).median()
  return month.set('system:time_start', s.millis(), 'm', m, 'Q',m, 
  'system:index', ee.String('Q').cat(ee.Number(m).int().format()))})

var s2 = s2.select(b).reduce(ee.Reducer.percentile([10,20,50,90,95]),4)

var GLO30 = ee.ImageCollection("projects/sat-io/open-datasets/GLO-30").filterBounds(aoi).mosaic().rename("GLO30")
var DSM05 = ee.Image("projects/geo4gras/assets/rio-segura/DSM05").rename("DSM05");
var DTM05 = ee.Image("projects/geo4gras/assets/rio-segura/DTM05").rename("DTM05");
var dif_DM05 = DSM05.subtract(DTM05).rename("dif_DM05");
var dif_DM30 = GLO30.subtract(DTM05).rename("dif_GLO30");
var slope = ee.Terrain.slope(DTM05).rename("Slope_DTM05")
var aspect = ee.Terrain.aspect(DTM05).rename("Aspect_DTM05")

// Map.addLayer(dif_DM05,{mmin:1, max:20})

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

var SAR20_HH = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HH").filterBounds(aoi).filter(ee.Filter.date('2020-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR20_HH")
var SAR20_HV = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HV").filterBounds(aoi).filter(ee.Filter.date('2020-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR20_HV")
var SAR1520_HH = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HH").filterBounds(aoi).filter(ee.Filter.date('2015-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR1520_HH");  
var SAR1520_HV = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HV").filterBounds(aoi).filter(ee.Filter.date('2015-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR1520_HV");

var S1_VH = ee.ImageCollection("projects/sat-io/open-datasets/S1GBM/normalized_s1_backscatter_VH").mosaic().rename("S1VH");
var S1_VV = ee.ImageCollection("projects/sat-io/open-datasets/S1GBM/normalized_s1_backscatter_VV").mosaic().rename("S1VV");
var hand30 = ee.ImageCollection("users/gena/global-hand/hand-100").mosaic().rename("HAND30")

//Label
var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop_2021")
var parcels_perm = parcels.filter(ee.Filter.eq('Training', "P"))

var classlabels = [
  "Fruit", 1,
  "Citrus", 2,
  "Olivos", 3,
  "Almonds", 4,
  "Vineyard", 5,
  "Vineyard (table grape)", 6,
  "Greenhouse", 7,
  "Young Fruit", 8,
  "Young Citrus", 9,
  "Low Density Tree Cover", 10]

classlabels = ee.Dictionary(classlabels)


var parcels_perm = parcels_perm.filter(ee.Filter.inList('Seasons_T', classlabels.keys()))
                // .filter(ee.Filter.notNull(['Q2_B2', 'Q3_B2']))
                .map(function(f){return f.set('label', classlabels.get(f.get('Seasons_T')))})
              
var perm_rst = parcels_perm.reduceToImage({properties: ['label'],reducer: ee.Reducer.first()});
var label = perm_rst.rename("Label");


//______Merge rasters______________
var layer = s2.addBands(SAR20_HH).addBands(SAR20_HV).addBands(SAR1520_HH).addBands(SAR1520_HV).addBands(GLO30).addBands(DSM05)
            .addBands(DTM05).addBands(dif_DM05).addBands(dif_DM30).addBands(slope).addBands(aspect)
            .addBands(label).addBands(S1_VH).addBands(S1_VV).addBands(hand30).addBands(DTM05_SM3)
            .addBands(Slope_SM3).addBands(DTM05_SM5).addBands(Slope_SM5).addBands(DTM05_SM10).addBands(Slope_SM10)
                      
var bandnames = layer.bandNames().removeAll(["year","Training","Superficie","Seasons_T","system:index","beam","TreeType_T","month","B1_p10","B1_p20","B1_p50","B1_p90","B1_p95","B9_p10","B9_p20","B9_p50","B9_p90","B9_p95"])


//______Train a RF classifier____

var pinkgreen = ['#8e0152','#c51b7d','#de77ae','#f1b6da','#fde0ef','#f7f7f7','#e6f5d0','#b8e186','#7fbc41','#4d9221','#276419']

////// ALL BANDS
var bands_all = samples.first().propertyNames().removeAll(["system:index","label"])
var df_bands_all = samples.select(bands_all)

var rf = ee.Classifier.smileRandomForest({numberOfTrees: 200, minLeafPopulation:10}).setOutputMode('REGRESSION')
var rf = rf.train({features:df_bands_all, classProperty: "rh98", inputProperties: bands_all})
var explain = rf.explain().get('outOfBagErrorEstimate')
var final_raster = layer.select(df_bands_all)
var height_layer = layer.classify(rf).rename("H_m")
var observation_prediction = height_layer.sampleRegions({collection:df_bands_all, properties: ["rh98"], scale:10, tileScale:10})
print("All bands", explain, getImp(rf)),calculateRMSE(observation_prediction)
Map.addLayer(height_layer.clip(parcels_perm), {min: 2, max: 6, palette:pinkgreen.reverse()},'1', 1); 


/// Selected bands 1
var bands_all = samples.first().propertyNames().removeAll(["system:index","label"])
var df_bands_all = samples.select(bands_all)
var bands_selection = ["rh98", "Slope_SM3" , "SAR1520_HV" , "SAR20_HV" , "S1VH" , "SAR1520_HH" , "B12_p95" ,
               "B11_p95" , "ndmi_p10" , "GLO30" , "SAR20_HH" , "B7_p95" , "B8A_p95" , "B11_p90", "B12_p50"]
var df_bands_all = samples.select(bands_selection)
            
var rf = ee.Classifier.smileRandomForest({numberOfTrees: 200, minLeafPopulation:10}).setOutputMode('REGRESSION')
var rf = rf.train({features:df_bands_all, classProperty: "rh98", inputProperties: bands_selection})
var explain = rf.explain().get('outOfBagErrorEstimate')
var final_raster = layer.select(df_bands_all)
var height_layer = layer.classify(rf).rename("H_m")
var observation_prediction = height_layer.sampleRegions({collection:df_bands_all, properties: ["rh98"], scale:10, tileScale:10})
print("Selected bands 1:", explain, getImp(rf)),calculateRMSE(observation_prediction)
Map.addLayer(height_layer.clip(parcels_perm), {min: 2, max: 6, palette:pinkgreen.reverse()},'2', 1); 


/// Selected bands
var bands_all = samples.first().propertyNames().removeAll(["system:index","label"])
var df_bands_all = samples.select(bands_all)
var bands_selection = ["rh98", "dif_GLO30" , "Slope_SM3" , "SAR1520_HV" , "SAR20_HV" , "SAR1520_HH" , "B12_p95" , "SAR20_HH"]
var df_bands_all = samples.select(bands_selection)
            
var rf = ee.Classifier.smileRandomForest({numberOfTrees: 00, minLeafPopulation:10}).setOutputMode('REGRESSION')
var rf = rf.train({features:df_bands_all, classProperty: "rh98", inputProperties: bands_selection})
var explain = rf.explain().get('outOfBagErrorEstimate')
var final_raster = layer.select(df_bands_all)
var height_layer = layer.classify(rf).rename("H_m")
var observation_prediction = height_layer.sampleRegions({collection:df_bands_all, properties: ["rh98"], scale:10, tileScale:10})
print("Selected bands 3", explain, getImp(rf)),calculateRMSE(observation_prediction)
Map.addLayer(height_layer.clip(parcels_perm), {min: 2, max: 6, palette:pinkgreen.reverse()},'3', 1); 


/// Selected bands
var bands_all = samples.first().propertyNames().removeAll(["system:index","label"])
var df_bands_all = samples.select(bands_all)
var bands_selection = ["rh98", "Slope_SM3" ,"GLO30", "SAR1520_HV" , "SAR20_HV" , "SAR1520_HH" , "B12_p95" , "SAR20_HH"]
var df_bands_all = samples.select(bands_selection)
            
var rf = ee.Classifier.smileRandomForest({numberOfTrees: 100, minLeafPopulation:10}).setOutputMode('REGRESSION')
var rf = rf.train({features:df_bands_all, classProperty: "rh98", inputProperties: bands_selection})
var explain = rf.explain().get('outOfBagErrorEstimate')
var final_raster = layer.select(df_bands_all)
var height_layer = layer.classify(rf).rename("H_m")
var observation_prediction = height_layer.sampleRegions({collection:df_bands_all, properties: ["rh98"], scale:10, tileScale:10})
print("Selected bands 4", explain, getImp(rf)),calculateRMSE(observation_prediction)
Map.addLayer(height_layer.clip(parcels_perm), {min: 2, max: 6, palette:pinkgreen.reverse()},'4', 1); 


// GEDI and Crop feature Collection

Map.addLayer(samples, {min:0,max:2000}, 'GEDI',0);

var crop_2021 = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop_2021")
var permanent = crop_2021.filter(ee.Filter.eq('Training', "P"))
print("Permanent",permanent.size())
Map.addLayer(permanent, {}, "perm_parcels",0)


//____Functions______

function getImp (model){
  var imp = ee.Dictionary(model.explain().get('importance'))
  var dict_to_fc = ee.FeatureCollection(imp.keys().map(function(k){
    return ee.Feature(null, {key: k, value: imp.getNumber(k)})
  }))

  var top10 = dict_to_fc.limit(120,'value', false)
  var keys = top10.aggregate_array('key')
  var vals = top10.aggregate_array('value').map(function(n){return ee.Number.parse(ee.Number(n).format().slice(0,5))})
  return keys.zip(vals)
}


function getS2(s,e){
  return ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(aoi)
  .filterDate(s,e)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 90))
  .combine(
    ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY")
    .filterBounds(aoi)
    .filterDate(s,e)
    )
  .map(function(i){
    var ndvi = i.normalizedDifference(['B8', 'B4']).rename('ndvi')
    // var lai = biopar.get_lai(i).float().rename('lai')
    var ndmi = i.normalizedDifference(['B8A', 'B11']).rename('ndmi')
    var savi = i.expression("(b('B8') - b('B4')) / (b('B8') + b('B4') + 0.428) * (1.0 + 0.428)").rename('savi')
    var nbr = i.normalizedDifference(['B9', 'B12']).rename('nbr')
    var ndre = i.normalizedDifference(['B9', 'B5']).rename('ndre')
    var bi = i.expression('sqrt((b("B4") * b("B4")) + (b("B3") * b("B3"))) / 2').rename('bi')
    return i.select(['B.*']).addBands([ndvi,ndmi,savi,nbr,ndre,bi]) //lai
    .updateMask(i.select('probability').lt(40))
    .set('y', i.date().get('year'), 'm', i.date().get('month'))
  })
}

function calculateRMSE(vals){
  var obs = ee.Array(vals.aggregate_array('rh98'))
  var pred = ee.Array(vals.aggregate_array('H_m'))
  var rmse = obs.subtract(pred).pow(2).reduce('mean', [0]).sqrt().get([0])
  var r2 = ee.Number(vals.reduceColumns(ee.Reducer.pearsonsCorrelation(), ['rh98', 'H_m']).get('correlation')).pow(2);
  var mae = ee.Number(obs.subtract(pred).abs().reduce('mean', [0]).get([0]))
  print('mae', mae, 'rmse', rmse, 'r2', r2)
  return 
}



;
