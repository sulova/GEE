var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop_2021");

var classes = parcels.aggregate_array('Seasons_T').distinct()
print(classes)

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


var parcels = parcels.filter(ee.Filter.inList('Seasons_T', classlabels.keys()))
                // .filter(ee.Filter.notNull(['Q2_B2', 'Q3_B2']))
                .map(function(f){return f.set('label', classlabels.get(f.get('Seasons_T')))})
                
var classes = parcels.aggregate_array('Seasons_T').distinct()
print(classes)
print('parcel size by class', parcels.aggregate_histogram('label'))

// Make an image out of the land area attribute.
var perm_rst = parcels
  .reduceToImage({
    properties: ['label'],
    reducer: ee.Reducer.first()
});

Map.addLayer(perm_rst, {
  min: 1,
  max: 9,
  palette: ['FCFDBF', 'FDAE78', 'EE605E', 'B63679', '711F81', '2C105C']
});



Export.image.toAsset({image:perm_rst, 
                      description:"perm_rasterized", 
                      assetId:"ee-sulovaandrea/assets/Segura", 
                      scale:10
                      maxPixels:1e13})
