/*
Find Important Variables for Classification
*/
var aoi = ee.Geometry.Polygon([[[-2.9, 39.01],[-2.89, 36.6],[0.07, 36.6],[0.08, 39.01]]]);
var crop_2021 = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop_2021")
var permanent = crop_2021.filter(ee.Filter.eq('Training', "P"))
print("Permanent",permanent.size())
Map.addLayer(permanent)

var crop_2020 = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop_2020")
var tall = crop_2020.filter(ee.Filter.eq('rh98', 12))

//______Input Sample Variables__________

var samples = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/GEDI_variables_20_Filter");
Map.addLayer(samples, {min:0,max:2000}, 'GEDI',0);
Map.centerObject(aoi,13); 
print("Size of training samples:",samples.size())


//_______Load_Layers______________


var aoi = ee.Geometry.Polygon([[[-2.9, 39.01],[-2.89, 36.6],[0.07, 36.6],[0.08, 39.01]]]);
var GLO30 = ee.ImageCollection("projects/sat-io/open-datasets/GLO-30").filterBounds(aoi).mosaic().rename("GLO30")
var DSM05 = ee.Image("projects/geo4gras/assets/rio-segura/DSM05").rename("DSM05");
var DTM05 = ee.Image("projects/geo4gras/assets/rio-segura/DTM05").rename("DTM05");
var dif_DM05 = DSM05.subtract(DTM05).rename("dif_DM05");
var dif_DM30 = GLO30.subtract(DTM05).rename("dif_GLO30");
var slope = ee.Terrain.slope(DTM05).rename("slope_DTM05")
var aspect = ee.Terrain.aspect(DTM05).rename("aspect_DTM05")
var SAR20_HH = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HH").filterBounds(aoi).filter(ee.Filter.date('2020-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR20_HH")
var SAR20_HV = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HV").filterBounds(aoi).filter(ee.Filter.date('2020-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR20_HV")
var SAR1520_HH = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HH").filterBounds(aoi).filter(ee.Filter.date('2015-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR1520_HH");  
var SAR1520_HV = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").select("HV").filterBounds(aoi).filter(ee.Filter.date('2015-01-01', '2020-12-31')).reduce(ee.Reducer.median()).rename("SAR1520_HV");


//______Load___S2__Layers______

var b = ['ndvi', 'ndre', 'savi', 'ndmi', 'nbr', 'bi', "B2", 'B12',"B8","B8A" ,"B11", "B7"]
var s2 =  getS2('2021-01-01', '2022-12-31', aoi)

var s2Q = ee.List.sequence(1,4,1).map(function(m){
  var s = ee.Date.fromYMD(2020, ee.Number(m).multiply(3).subtract(2), 1)
  var e = s.advance(3, 'month')
  var month = s2.filterDate(s,e).select(b).median()
  return month.set('system:time_start', s.millis(), 'm', m, 'Q',m, 
  'system:index', ee.String('Q').cat(ee.Number(m).int().format()))})

var s2 = s2.select(b).reduce(ee.Reducer.percentile([10,20,50,90,95]),4)


//______Train Model__________________

var sample_bands = ["rh98", "dif_GLO30" , "slope_DTM05" , "SAR1520_HV" , "SAR20_HV" , "SAR1520_HH" , 
               "B12_p95" , "SAR20_HH", "B8_p20" , "B11_p95" , "ndmi_p10" , "GLO30" , "B11_p20" ,
               "B7_p95" , "B8A_p95" , "B11_p90", "B12_p50",  "B2_p10", "B12_p90", "B8_p10", 
               "B11_p50", "B8_p90" ]         
               
var samples = samples.select(sample_bands)

var rf = ee.Classifier.smileRandomForest({numberOfTrees: 100, minLeafPopulation:10}).setOutputMode('REGRESSION')
var rf = rf.train({features:samples, classProperty: "rh98", inputProperties: sample_bands})
var explain = rf.explain().get('outOfBagErrorEstimate')
print(explain, getImp(rf))


//______Apply Model_________________
var img_bands = ["dif_GLO30" , "slope_DTM05" , "SAR1520_HV" , "SAR20_HV" , "SAR1520_HH" , 
               "B12_p95" , "SAR20_HH", "B8_p20" , "B11_p95" , "ndmi_p10" , "GLO30" , "B11_p20" ,
               "B7_p95" , "B8A_p95" , "B11_p90", "B12_p50",  "B2_p10", "B12_p90", "B8_p10", 
               "B11_p50", "B8_p90" ]

var raster = s2.addBands(GLO30).addBands(DSM05).addBands(DTM05).addBands(dif_DM05).addBands(dif_DM30).addBands(slope)
           .addBands(SAR20_HH).addBands(SAR20_HV).addBands(SAR1520_HH).addBands(SAR1520_HV).select(img_bands).clip(aoi)


var height_layer = raster.classify(rf).rename("H_m")
Map.addLayer(height_layer, {min: 0, max: 20, palette: ['yellow', 'green']},'height_layer', 0);

var  height_raster = height_layer.clip(permanent)
Map.addLayer(height_raster,{min: 0, max: 20, palette: ['yellow', 'green']}, "height_layer_clip")



//______EXPORT_DATA_______________

Export.image.toDrive({image: height_raster, 
                  description:"Segura_height_20m", 
                  region: aoi,
                  scale:20, 
                  maxPixels:1e13})

//_______RMSE_____________________


var image_100 = ee.Image("projects/geo4gras/assets/rio-segura/Height_20m_perm_F100")
var image_300 = ee.Image("projects/geo4gras/assets/rio-segura/Height_20m_perm_F300")

var image_100 = image_100.sampleRegions(
            {collection: samples,
            properties: ["rh98"],
            scale: 20, 
            tileScale:16})
            
var image_300 = image_300.sampleRegions(
            {collection: samples,
            properties: ["rh98"],
            scale: 20, 
            tileScale:16})   
            
var height_raster = height_raster.sampleRegions(
            {collection: samples,
            properties: ["rh98"],
            scale: 20, 
            tileScale:16})             
            
var observation = calculateRMSE(image_100)
var observation = calculateRMSE(image_300)
var observation = calculateRMSE(height_raster)


//____Functions______

function getImp (model){
  var imp = ee.Dictionary(model.explain().get('importance'))

  var dict_to_fc = ee.FeatureCollection(imp.keys().map(function(k){
    return ee.Feature(null, {key: k, value: imp.getNumber(k)})
  }))

  var top10 = dict_to_fc.limit(10,'value', false)
  var keys = top10.aggregate_array('key')
  var vals = top10.aggregate_array('value').map(function(n){return ee.Number.parse(ee.Number(n).format().slice(0,5))})
  print(keys)
  return keys.zip(vals)
}


function getS2(s,e,aoi){
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
  ///rmse gives high weight to large errors. Could be problematic.
  // var vals = clf_img.rename('pred').sampleRegions(training_fc, ['OC'], 10)
  var obs = ee.Array(vals.aggregate_array('rh98'))
  var pred = ee.Array(vals.aggregate_array('H_m'))
  var rmse = obs.subtract(pred).pow(2).reduce('mean', [0]).sqrt().get([0])
  var r2 = ee.Number(vals.reduceColumns(ee.Reducer.pearsonsCorrelation(), ['rh98', 'H_m']).get('correlation')).pow(2);
  var mae = ee.Number(obs.subtract(pred).abs().reduce('mean', [0]).get([0]))
  print('mae', mae, 'rmse', rmse, 'r2', r2)
  return rmse
}

