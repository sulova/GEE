print(geometry);

// Extract annual land surface temperature (LST) data 
// from TERRA MODIS satellite-product

// 1. Defines boundary
Map.addLayer(geometry, {}, "Daerah Penelitian");
Map.centerObject(geometry, 9.5);

// 2. Extract time series LST data
//2.1 Load image collection of TERRA MODIS and add new properties
var StartDate = '2010-01-01';
var StopDate = '2020-12-31';

var LST = ee.ImageCollection("MODIS/006/MOD11A1")
            .select('LST_Day_1km')
            .filterDate(StartDate, StopDate)
            .filterBounds(geometry)
            .map(function(img){
              return img.set({'Year': ee.Image(img).date().get('year'), 'month': ee.Image(img).date().get('month')});
            });
print(LST.limit(100));

// Create a list of selected years
var years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020];

// Parameter Visualization
var LST_Vis = {min: 00, max:20,palette:['blue','green','yellow','orange','red']};

// Loop function to extract annual image of LST data autonomously
for(var a = 0; a < years.length; a++) {
  print(years[a])
  var LST_series = LST.filterMetadata('Year', 'equals', years[a])
  var annual_LST = LST_series.mean().multiply(0.02).subtract(273.15).clip(geometry)
  print(annual_LST)
  
  Map.addLayer(annual_LST, LST_Vis, years[a] + " " + 'Land Surface Tempereature')
  
  //Export image
  Export.image.toDrive({
    image: annual_LST,
    description: 'MODIS' + " " + years[a] + " " + 'Land Surface Tempereature',
    scale: 1000,
    region: geometry 
  });
}
