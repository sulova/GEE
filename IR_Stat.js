var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop/crop_2021");
Map.centerObject(geometry,8)

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
print(IR)

                          
var IR_mean = IR.reduceRegions({collection:parcels, reducer:ee.Reducer.mean(), scale:20, tileScale:10})                          


//____MAPs_______

var IRsum_21M01 = IR.select('IRsum_21M01')
var IRsum_21M02 = IR.select('IRsum_21M02')
Map.addLayer(IRsum_21M01, {min: 1,  max: 3, palette: ['FCFDBF', '711F81', '2C105C']},"IRsum_21M01",1)
Map.addLayer(IRsum_21M02, {min: 1,  max: 3, palette: ['FCFDBF', 'FDAE78', 'EE605E', 'B63679', '711F81', '2C105C']},"IRsum_21M02",1)
