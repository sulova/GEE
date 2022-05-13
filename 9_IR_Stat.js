var point =ee.Geometry.Point([-1.3, 37.7]);
Map.centerObject(point,15)

Map.setOptions('hybrid')
var rdGn = ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']
var vis =  {min: 0,  max: 1, palette: ['FCFDBF', '2C105C']}

var image_1 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210101_20210131_sum"),
    image_2 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210201_20210228_sum"),
    image_3 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210301_20210331_sum"),
    image_4 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210401_20210430_sum"),
    image_5 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210501_20210531_sum"),
    image_6 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210601_20210630_sum"),
    image_7 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210701_20210731_sum"),
    image_8 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210801_20210831_sum"),
    image_9 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210901_20210930_sum"),
    image_10 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20201001_20201031_sum"),
    image_11 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20201101_20201130_sum"),
    image_12 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20201201_20201231_sum");

var IR = ee.Image.cat([image_1,image_2,image_3,image_4,image_5,image_6,image_7,image_8,image_9,image_10,image_11,image_12]);
var IR = IR.rename(['IR21M01','IR21M02','IR21M03','IR21M04','IR21M05','IR21M06',
                    'IR21M07','IR21M08','IR21M09','IR20M10','IR20M11','IR20M12'])
print("IR",IR)

//____MAPs_______
var bandNames = IR.bandNames(); 
for(var i = 0; i < bandNames.size().getInfo(); i++){
  var image = ee.Image(IR.select(bandNames.getString(i)));
  var name = bandNames.getString(i).getInfo()
  Map.addLayer(image, vis, name.toString(),  0)}    


//___Parcel_______  
var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop/crop_2021_geom_fix");
var im_geo = image_1.geometry();
var parcels = parcels.filterBounds(im_geo)
Map.addLayer(parcels, {}, 'parcels IR',0)
print("parcels within IR raster", parcels.size())


//___Percentile + Medain + Mean____
var IR_mean = IR.rename(['IR21M01_mean','IR21M02_mean','IR21M03_mean','IR21M04_mean','IR21M05_mean','IR21M06_mean',
                         'IR21M07_mean','IR21M08_mean','IR21M09_mean','IR20M10_mean','IR20M11_mean','IR20M12_mean'])
var IR_mean = IR_mean.reduceRegions({collection:parcels, reducer:ee.Reducer.mean(), scale:20, tileScale:10})

var IR_med = IR.rename(['IR21M01_med','IR21M02_med','IR21M03_med','IR21M04_med','IR21M05_mean','IR21M06_mean',
                    'IR21M07_mean','IR21M08_mean','IR21M09_mean','IR20M10_mean','IR20M11_mean','IR20M12_mean'])
var IR_med = IR_med.reduceRegions({collection:parcels, reducer:ee.Reducer.median(), scale:20, tileScale:10})


var IR = IR.rename(['IR21M015','IR21M02_p75','IR21M03_p75','IR21M04_p75','IR21M05_p75','IR21M06_p75',
                    'IR21M07_p75','IR21M08_p75','IR21M09_p75','IR20M10_p75','IR20M11_p75','IR20M12_p75'])
var IR_p75 = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.percentile([75,90]), scale:20, tileScale:10})

var IR = IR.rename(['IR21M01_p85','IR21M02_p85','IR21M03_p85','IR21M04_p75','IR21M05_p75','IR21M06_p75',
                    'IR21M07_p75','IRsum_21M08','IR21M09_p75','IR20M10_p75','IR20M11_p75','IR20M12_p75'])
//var IR_p85 = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.percentile([80]), scale:20, tileScale:10})
// var IR_per_95 = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.percentile([95]), scale:20, tileScale:10})
//var percentiles = IR.reduce(ee.Reducer.percentile([60,75,80,98]), 1)
//Map.addLayer(IR_median, {min:0, max:20, bands:['C21_M08'], palette:rdGn}, 'C21_M08 median', false)
print("IR_p75", IR_p75.first(),IR_p75.size())


Map.addLayer(IR_p75, {min:0, max:20, bands:['IRsum_21M06'], palette:rdGn}, 'C21_M08 per75', true)



// Epxorted statistics
var IR_mean = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.mean(), scale:20, tileScale:10})  
 
 
// Export the image, specifying scale and region.
// Export.table.toAsset(IR_mean, 'IR_20m_mean_pacel', 'projects/geo4gras/assets/rio-segura/ET/IR_20m_mean_pacel')
// Export.table.toDrive({collection:IR_mean, description: 'IR_20m_mean_pacel', fileFormat:"GeoJSON"})




/*                    
var classlabels  = [
  "Young Herbaceous irrigated in winter",21 ,
  "Herbaceous irrigated in spring", 22,
  "Herbaceous irrigated in summer",23 ,
  "Herbaceous irrigated in autumn", 24,
  "Herbaceous with double harvest (outside summer)", 31,
  "Herbaceous with triple harvest (outside summer)", 32,
  "Herbaceous with double harvest (including one in summer)" , 33,
  "Herbaceous with triple harvest (including one in summer)", 34,
  "Fruit", 1,
  "Citrus", 2,
  "Olivos_LAC", 3,
  "Olivos_LBC", 4,
  "Almonds", 5,
  "Vineyard", 6,
  "Vineyard (table grape)", 7,
  "Greenhouse", 8,
  "Young Fruit", 9,
  "Young Citrus", 10,
  "Low Density Tree Cover", 11,
  "Family gardens",12]

var classlabels = ee.Dictionary(classlabels)
var parcels = parcels.filter(ee.Filter.inList('Seasons_T', classlabels.keys()))
                // .filter(ee.Filter.notNull(['Q2_B2', 'Q3_B2']))
                .map(function(f){return f.set('label', classlabels.get(f.get('Seasons_T')))})
print('parcel size by class', parcels.aggregate_histogram('label'))

*/

