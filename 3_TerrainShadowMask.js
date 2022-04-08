var geometry =  ee.Geometry.Polygon(
        [[[6.961516106997745, 46.9868024554321337],
          [8.0190654228270475, 46.9868024554321337],
          [8.0190654228270475,48.0132018857476410],
          [6.961516106997745,48.0132018857476410]]], null, false)

var glo = ee.ImageCollection("projects/sat-io/open-datasets/GLO-30");

var elevation = glo.mosaic().setDefaultProjection('EPSG:3857',null,30).clip(geometry)

var shadowMap = ee.Terrain.hillShadow({
  image: elevation,
  azimuth: 120,
  zenith: 60,
  //neighborhoodSize: ,
  //hysteresis: true
});

Map.addLayer(shadowMap,{min: 0, max: 1}, 'shadowMap');
Map.addLayer(elevation, { min: 0, max: 2000}, 'elevation');

Map.centerObject(elevation, 8);

Export.image.toDrive({  
    image: shadowMap,
    description:"shadowMap",
    scale: 30,  
    region: geometry})
    
var shadowMap = shadowMap.visualize({min: 0, max: 1})    
var thumbParams = {dimensions: 1000}
print(shadowMap.getThumbURL(thumbParams))
