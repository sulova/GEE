var point =ee.Geometry.Point([-1.3, 37.7]);
var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop/crop_2021_geom_fix");
Map.centerObject(point,10)
Map.addLayer(parcels, {}, 'Parcels',0)
print("parcels all data", parcels.size(), parcels.limit(10))


var boundary =  ee.Geometry.Polygon(
        [[[-1.8768157440040856, 37.94208318171865],
          [-1.8768157440040856, 36.93453392417151],
          [-0.6132246692249632, 36.93453392417151],
          [-0.6132246692249632, 37.94208318171865]]], null, false);

var parcels_fil = parcels.filterBounds(boundary)
Map.addLayer(parcels_fil, {}, 'parcels_fil',0)
print("parcels_fil", parcels_fil.size(), parcels_fil.limit(10))



print("Size of training parcels:",parcels.size())
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
    
var IR = ee.Image.cat([image_1,image_2,image_3,image_4,image_5,image_6,
                       image_7,image_8,image_9,image_10,image_11,image_12]);

var IR = IR.rename(['C21_M01', 'CM21_M02', 'CM21_M03', 'CM21_M04', 'CM21_M05', 'CM21_M06',
                    'CM21_M07', 'CM21_M08', 'CM21_M09', 'CM20_M10', 'CM20_M11', 'CM20_M12']) 
                    
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

var parcels = parcels.filter(ee.Filter.inList('Seasons_T', classlabels.keys()))
                .map(function(f){return f.set('label', classlabels.get(f.get('Seasons_T')))})
print('Translate size by class', parcels.aggregate_histogram('Seasons_T'))



//____MAPs_______

var vis =  {min: 0,  max: 1, palette: ['FCFDBF', '2C105C']}
var bandNames = IR.bandNames(); 

for(var i = 0; i < bandNames.size().getInfo(); i++){
  var image = ee.Image(IR.select(bandNames.getString(i)));
  var name = bandNames.getString(i).getInfo()
  Map.addLayer(image, vis, name.toString(),  0)}
Map.addLayer(parcels, {}, 'Parcels',0)


// Epxorted statistics
 
 var IR_mean = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.mean(), scale:20, tileScale:10})  
 
 
// Export the image, specifying scale and region.
// Export.table.toAsset(IR_mean, 'IR_20m_mean_pacel', 'projects/geo4gras/assets/rio-segura/ET/IR_20m_mean_pacel')
// Export.table.toDrive({collection:IR_mean, description: 'IR_20m_mean_pacel', fileFormat:"GeoJSON"})

///__________Statistics per parcels_______________
var IR_parcel = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/ET/IR_20m_mean_pacel");
print("all data", IR_parcel.size(), IR_parcel.limit(10))

var IR_parcel =IR_parcel.filter(ee.Filter.notNull(['IRsum_20M10']))
print("Filter data", IR_parcel.size(), IR_parcel.limit(10))

Map.addLayer(IR_parcel, {}, 'Parcels',1)
