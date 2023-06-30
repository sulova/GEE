// Define Gemeotry
var aoi = ee.FeatureCollection("projects/geo4gras/assets/EO-Clinic/AOI_Irrigation")
Map.addLayer(aoi, {palette: 'FF0000'}, 'ROI', false);
Map.centerObject(ee.Geometry.Point([92.0230851190773, 21.600870579960606]), 14)
Map.setOptions('SATELLITE');

var lines = lines.union(geometry,1).union(geometry2, 1).union(geometry4, 1);;

var masking =  ee.Image.constant(0).clip(aoi).clip(lines.buffer(100)).mask();
Map.addLayer(masking, {}, 'masking', 0)


// Define the time range
var start = ee.Date('2017-11-01');
var end = ee.Date('2018-04-01');

// Get years and Months variables
var years = ee.List.sequence(start.get('year'),end.get('year'),1)
var months = ee.List.sequence(start.get('month'), 12).cat(ee.List.sequence(1, end.get('month')));
var start_date = start
var end_date = start.advance(5, 'month');

// 1) Calculate Agricultural Mask
var composites = ee.ImageCollection([])
Map.addLayer(ImageCollectionS2(start_date, end_date).mean().select(['B4', 'B3', 'B2']).clip(aoi), {bands: ['B4', 'B3', 'B2'], min: 500, max: 1800}, 'RGB', 0)
    
// 1.A Monthly MAX composites
for(var m = 0; m < 5; m++) {
     var start_date_month = start_date.advance(m, 'month');
     var end_date_month = start_date.advance(m+1, 'month');
     var max_month_composite = ImageCollectionS2(start_date_month, end_date_month).max()
     // print(start_date_month,end_date_month)
     var composites = composites.merge(ee.Image(max_month_composite).set({'month': m}))}
  
// 1.B The monthly MAX composites are divided by the NumberObservation.
var season_composite = composites.reduce(ee.Reducer.sum()).rename(['B2', 'B3', 'B4','ndvi']);
var season_median_composite = season_composite.divide(5).select('ndvi')
Map.addLayer(season_median_composite, {bands: ['ndvi'], min:-80, max:80,  palette:['blue', 'white', 'green']}, 'Season NDVI', 0)


// 2) Permanent vegetation ->  Annual percentile
var start_annual = start_date.update({'month': 6,'day': 1 })
var end_annual = start_annual.advance(12, 'month');

//___Dan's Permanent Layer
/// 98th percentile must be > 45. Permanent vegetation? That could also include agriculture...
/// Permanent means that it is consistently high. Agriculture usually fluctuates.
var percentiles = ImageCollectionS2(start_annual, end_annual).select('ndvi').reduce(ee.Reducer.percentile([25,50,89]))//.rename('NDVI_percentile');
var ndvi_p85 = percentiles.select('ndvi_p89')//.gt(45)
var ndvi_p50 = percentiles.select('ndvi_p50')
var ndvi_p25 = percentiles.select('ndvi_p25')
var ndvi_dif = ndvi_p85.subtract(ndvi_p50)
var ndvi_dif2 = ndvi_p85.subtract(ndvi_p25)
/// permanent would be a high through the year (no low values) and low difference.

var permanent_vegetation = ndvi_p25.gt(20).and(ndvi_dif2.lt(20)).rename('ndvi').selfMask()
Map.addLayer(permanent_vegetation, {bands: ['ndvi'], palette:['yellow']},'Permanent Vegetation Dan 20', 0)
 
 
// 2.A Remove narrow lines around parcels--> expand Permanent Layer
// var permanent_vegetation = MMU(permanent_vegetation, 5).rename('ndvi')
var permanent_vegetation = dilate(permanent_vegetation,5).rename('ndvi').selfMask()
Map.addLayer(permanent_vegetation, {bands: ['ndvi'], palette:['#7FFFD4']},'Permanent Vegetation MMU', 0)


// 3) Agricultural Mask 
var agriculturalThreshold_top = 35
var agriculturalThreshold_low = 1
/// take mean ndvi. Threshold greater than 0.2 (vegetated). AND less than 0.5
var agricultural_mask = season_median_composite.updateMask(
                        season_median_composite.gt(agriculturalThreshold_low)
                        .and(season_median_composite.lt(agriculturalThreshold_top))).selfMask()
Map.addLayer(agricultural_mask, {bands: ['ndvi'], palette:['ce7e00']}, 'Agricultural mask', 0)



// 3.A Mask Agricultural mask with the permanent vegetation
var agricultural_mask = ee.Image(0).where(agricultural_mask, 1);
var agricultural_masked = (agricultural_mask.where(permanent_vegetation, 0)).selfMask();

// Dilate + Erode +  Minimum Mapping Unit (MMU)
var agricultural_masked = erode(agricultural_masked, 10).rename('ndvi')
var agricultural_masked = dilate(agricultural_masked,10).rename('ndvi')
//var agricultural_mask_final = MMU(agricultural_mask_final, 8).rename('ndvi')
var agricultural_masked = agricultural_masked.selfMask()
Map.addLayer(agricultural_masked.clip(aoi), {bands: ['ndvi'], palette:['#088F8F']},'Agricultural Masked By Permanent Veg Mask', 0)

// 3.B Water mask
var start_water = ee.Date('2016-01-01')
var end_water = ee.Date('2018-12-01');
var water_mask = ImageCollectionS2(start_water, end_water).select('ndvi').median().lt(-10).selfMask().rename('water');
var water_mask = dilate(water_mask,10).rename('water').selfMask()
Map.addLayer(water_mask, {bands: ['water'], palette:['blue']},'Permanent Water', 0)

var agricultural_masked = agricultural_masked.where(water_mask, 0).selfMask();
Map.addLayer(agricultural_masked.clip(aoi), {bands: ['ndvi'], palette:['brown']},'Agricultural Masked By Water Mask',0 )

// 4) Irrigation Mask
var irrigation_NDVI = season_median_composite.updateMask(agricultural_masked)
Map.addLayer(irrigation_NDVI, {bands: ['ndvi'], min:-80, max:80,  palette:['blue', 'white', 'green']}, 'Irrigation NDVI', 0)
var irrigation_NDVI = irrigation_NDVI.updateMask(agricultural_mask)

var irrigationThreshold_top = 10
var irrigationThreshold_low = 7
var irrigation_mask = irrigation_NDVI.updateMask(irrigation_NDVI.gt(irrigationThreshold_low))
                       .and(irrigation_NDVI.updateMask(irrigation_NDVI.lt(irrigationThreshold_top)))

// Dilate + Erode +  Minimum Mapping Unit (MMU)
// var irrigation_mask = erode(irrigation_mask, 10).rename('ndvi')
var irrigation_mask = dilate(irrigation_mask, 10).rename('ndvi')
var irrigation_mask = MMU(irrigation_mask, 10).rename('ndvi')
Map.addLayer(irrigation_mask.clip(aoi), {bands: ['ndvi'],  palette:['#008fce']}, 'Irrigation mask', 0)


// 5) Land_Cover_2020_&_2021
var landCover = ee.ImageCollection('ESA/WorldCover/v200').first().clip(aoi).updateMask(50);
var urbanMask = landCover.eq(50);
// Map.addLayer(urbanMask, {}, 'Landcover',0);
 
// RECLASS
var final = ee.Image(3).where(agricultural_masked, 2);  // 3-other  2-irrigated 1- rainfed
var final = final.where(irrigation_mask, 1)
var final = final.where(masking, 3)
var final = final.where(urbanMask, 3)

Map.addLayer(final.clip(aoi), {bands: ['constant'], min: 1, max: 3, palette:['#008fce','#D9D40C', '#cea600']},  'Final Classification', 1)

// Export
Export.image.toDrive({
  image: final.select(['constant']).uint8().clip(aoi),
  description: 'Irrigation_' + start.get('year').getInfo().toString(),
  region: aoi, 
  folder:'EO',
  scale: 10,
  maxPixels: 10e12,
  shardSize: 256,  //shardSize: 1024,
  fileDimensions: 256*2*10*10,
  formatOptions: {cloudOptimized:true},
  crs: 'EPSG:4326'})



/*
var esri_lulc10 = ee.ImageCollection("projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS");
var palette =  [ "#1A5BAB","#358221","#87D19E","#FFDB5C","#ED022A","#EDE9E4","#F2FAFF","#C8C8C8","#C6AD8D"];
Map.addLayer(ee.ImageCollection(esri_lulc10.filterDate('2021-11-01','2022-03-31').mean()), {min:1, max:9, palette:palette}, '2017 LULC 10m')
*/

///______F U N C T I O N__________________

function ImageCollectionS2 (startDate, endDate){
  // S2_SR_HARMONIZED or  S2_SR collection does exits  2017 & 2018 only a few
  var s2 = ee.ImageCollection("COPERNICUS/S2_HARMONIZED")
            .filter([ee.Filter.date(startDate, endDate),
                    ee.Filter.bounds(aoi),ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60)])
  var s2_cloudless = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY").filter([
            ee.Filter.date(start_date, end_date),
            ee.Filter.bounds(aoi)])
            
            
  var join = ee.Join.inner().apply({
        'primary': s2,
        'secondary': s2_cloudless,
        'condition': ee.Filter.equals({'leftField': 'system:index','rightField': 'system:index'})})
  
  var merged = ee.ImageCollection(join.map(function(i){
    return ee.Image(i.get('primary')).addBands(i.get('secondary'))}))

  var cloud_masked = merged.map(function(i){
    // var s2c = i.select('probability')
    // var cloudmask = s2c.lt(30).focal_min(9).focal_max(3)
      
    return i.updateMask(i.select('probability').lt(70))//.updateMask(cloudmask)
    .set('time', i.date().format('MM/dd/YYYY'))})
    
  //Calculation ndvi and valid data
  var s2 = ee.ImageCollection(cloud_masked).map(function(i){
              var ndvi = i.normalizedDifference(['B8', 'B4']).multiply(100).rename('ndvi').round()
              return i.addBands([ndvi])})

  var ImageCollection = ee.ImageCollection(s2).select(["B2", "B3", "B4", "ndvi"])
  return ImageCollection}

function MMU (img, n){
  var patches = img.gte(0).connectedPixelCount(256, true)
  return img.updateMask(patches.gte(n))}

function erode(img, distance) {
  var d = (img.not().unmask(1)
      .fastDistanceTransform(30).sqrt()
      .multiply(ee.Image.pixelArea().sqrt()))
  return img.updateMask(d.gt(distance))
}

function dilate(img, distance) {
  var d = (img.fastDistanceTransform(30).sqrt()
      .multiply(ee.Image.pixelArea().sqrt()))
  return d.lt(distance)
}
