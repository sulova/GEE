var point =ee.Geometry.Point([-1.3, 37.7]);
var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop/crop_2021");
Map.centerObject(point,10)
print("Size of training parcels:",parcels.size())
;

var image_1 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210101_20210131_sum"),
    image_2 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210201_20210228_sum"),
    image_3 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210301_20210331_sum"),
    image_4 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210401_20210430_sum"),
    image_5 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210501_20210531_sum"),
    image_6 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210601_20210630_sum"),
    image_7= ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210701_20210731_sum"),
    image_8 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210801_20210831_sum"),
    image_9 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20210901_20210930_sum"),
    image_10 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20201001_20201031_sum"),
    image_11 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20201101_20201130_sum"),
    image_12 = ee.Image("projects/geo4gras/assets/rio-segura/ET/IR_20201201_20201231_sum");

var IR = ee.Image.cat([image_1,image_2,image_3,image_4,image_5,image_6,
                       image_7,image_8,image_9,image_10,image_11,image_12]);

var IR = IR.rename(['IRsum_21M01', 'IRsum_21M02', 'IRsum_21M03', 'IRsum_21M04', 'IRsum_21M05', 'IRsum_21M06',
                    'IRsum_21M07', 'IRsum_21M08', 'IRsum_21M09', 'IRsum_20M10', 'IRsum_20M11', 'IRsum_M2012']) 
                    
var IR_mean = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.mean(), scale:20, tileScale:10})                          

print(IR_mean.size(), IR_mean.limit(10))

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
                // .filter(ee.Filter.notNull(['Q2_B2', 'Q3_B2']))
                .map(function(f){return f.set('label', classlabels.get(f.get('Seasons_T')))})
print('Translate size by class', parcels.aggregate_histogram('Seasons_T'))

//____MAPs_______
var vis =  {min: 0,  max: 1, palette: ['FCFDBF', '2C105C']}
var bandNames = IR.bandNames(); 

for(var i = 0; i < bandNames.size().getInfo(); i++){
  var image = ee.Image(IR.select(bandNames.getString(i)));
  var name = bandNames.getString(i).getInfo()
  Map.addLayer(image, vis, name.toString(),  true)}

Map.addLayer(parcels, {}, 'Parcels',0)
  
