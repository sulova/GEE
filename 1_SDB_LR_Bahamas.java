/*
Name:Andrea Sulova
Date: 2022 Jan 24
Objectives: Obtaining SDB using NICFI and Icesat data
*/

var geometry =     ee.Geometry.MultiPolygon(
        [[[[-77.04738372700008, 26.64474501163883],
           [-77.04738372700008, 26.64474501163883],
           [-77.04738372700008, 26.64474501163883],
           [-77.04738372700008, 26.64474501163883]]],
         [[[-77.04429382221493, 26.651802650556455],
           [-77.04429382221493, 26.646893034882286],
           [-77.03845733539852, 26.646893034882286],
           [-77.03845733539852, 26.651802650556455]]],
         [[[-77.1817945432565, 26.714066311039613],
           [-77.1817945432565, 26.536055006771377],
           [-77.01974620341275, 26.536055006771377],
           [-77.01974620341275, 26.714066311039613]]]], null, false),
    table = ee.FeatureCollection("projects/ee-sulovaandrea/assets/icesat2_Bahamas");

Map.centerObject(geometry,12)

//-------------------I N P U T --- D A T A -------------------------//

var icesat = ee.FeatureCollection("projects/ee-sulovaandrea/assets/icesat2_Bahamas");
var icesat = icesat.filterBounds(geometry);

var depthName = 'depth'

var nicfi = ee.ImageCollection("projects/planet-nicfi/assets/basemaps/americas")
            .filterDate('2021-12-01', '2021-12-12')
            .filterBounds(geometry).first().clip(geometry);
            
var vis_nicfi = {"bands":["R","G","B"],"min":200,"max":2454,"gamma":2};  

// Paint the edges with different colors, display.
// Create an empty image into which to paint the features, cast to byte.
var empty = ee.Image().byte();
var outlines = empty.paint({
  featureCollection: icesat,
  color: depthName,
  width: 10
});
var palette = ['#3B4CC0', '#6F91F2', '#A9C5FC', '#DDDDDD', '#F6B69B', '#E6745B', '#B40426'];

//------------------- L A N  D   M A S K -------------------------//

// Select near-infrared band
var NIR_thres = 700
var NIR = nicfi.select('N')

// Use threshold to define land and water boundary
var landmask = NIR.where(NIR.gt(NIR_thres),0).where(NIR.lt(NIR_thres),1);
  
// Mask NICFI image using landmask data and clip to boundary
var nicfi_masked = nicfi.updateMask(landmask)


//---- S P L I T  ICESAT DATA TRAINING/VALIDATION -------------------------//

var split = 0.80;
var bathyPoints = ee.FeatureCollection(icesat.randomColumn('random').sort('random'))
var bathyTrain = bathyPoints.filter(ee.Filter.lt('random', split));
var bathyValid = bathyPoints.filter(ee.Filter.gte('random', split));
print( 'All Icesat Points',(bathyPoints.size()),'Train Icesat Points',(bathyTrain.size()),'Valid Icesat Points',(bathyValid.size()))


// Select optical bands and take log
var logBands = nicfi_masked.select(['B', 'G', 'R'],['blue', 'green', 'red']).log()

// Get the values for all pixels in each points in the training.
var training = logBands.sampleRegions({
  collection: bathyTrain,
  // Keep this list of properties from the points
  properties: [depthName],
  scale: 4.77
  })
  // Add a constant property to each feature to be used as an independent variable.
  .map(function(feature) {
  return feature.set('constant', 1);});

//  ------------------------------------------------------------------   //

// Compute linear regression coefficients. numX is 4 because
// there are four independent variables; constant, blue, green and red. numY is 1
// because there is one dependent variable: recorded depth. Cast the resulting
// object to an ee.Dictionary for easy access to the properties.
var linearRegression = ee.Dictionary(training.reduceColumns({
  reducer: ee.Reducer.linearRegression({
    numX: 4,
    numY: 1}),
  selectors: ['constant', 'blue', 'green', 'red', depthName]
}));
  

// Flatten the array images to get multi-band images according to the labels.
var linearCoefList = ee.Array(linearRegression.get('coefficients')).toList();
var residuals = ee.Array(linearRegression.get('residuals')).toList().get(0);

// Print results
print('y-intercept:', ee.Number(linearCoefList.get(0)));
print('Coefficients:', linearCoefList);
print('Residual (RMSE):', residuals)

//  ----------------V A L I D A T I O N ---------------------------------   //

/*
SDB = S2[blue] * coefficient[blue] +  S2[green] * coefficient[green] + 
      S2[red] * coefficient[red] +  yIntercept
*/

var linearSDB = (logBands.select(['blue']).multiply(ee.Number(linearCoefList.get(1))))
                        .add((logBands.select(['green']).multiply(ee.Number(linearCoefList.get(2)))))
                        .add((logBands.select(['red']).multiply(ee.Number(linearCoefList.get(3)))))
                        .add(ee.Number(ee.Number(linearCoefList.get(0)))).rename(['sdb']);

// Extract classification result in validation data
var linearValidation = linearSDB.select(['sdb']).sampleRegions({
  collection: bathyValid,
  properties: [depthName],
  scale: 4.77});

// Gather the log blue/green ratio values from the point sample into a list of lists.
var props = ee.List(['sdb', depthName]);

var linearRegVarsList = ee.List(linearValidation.reduceColumns({
  reducer: ee.Reducer.toList().repeat(props.size()),
  selectors: props
}).get('list'));

// Convert regression x and y variable lists to an array - used later as input.

var x = ee.Array(ee.List(linearRegVarsList.get(0)));
var y1 = ee.Array(ee.List(linearRegVarsList.get(1)));

// Make a scatter plot of the two bands for the point sample and include
// the least squares line of best fit through the data.

print(ui.Chart.array.values({
  array: y1,
  axis: 0,
  xLabels: x})
  .setChartType('ScatterChart')
  .setOptions({
    hAxis: {'title': 'Actual Depth'},
    vAxis: {'title': 'Estimated Depth', viewWindowMode: 'maximized'},
    series: {
      0: {visibleInLegend: true, pointSize: 3, dataOpacity: 0.5},
      },
    trendlines: {
        0: {
          type: 'linear',
          color: 'red',
          lineWidth: 3,
          opacity: 0.7,
          showR2: true,
          visibleInLegend: true,
        }
    }
  }))


//----------------- L A Y E R S  -------------------------//

Map.addLayer(nicfi, vis_nicfi, '2021-12 mosaic',0)
Map.addLayer(nicfi_masked, vis_nicfi,'NICFI LandMask',0)
Map.addLayer(outlines, {palette: palette, min: -7, max:0 }, 'Icesat Points',1);
var sbd_vis = {min:-10.0, max:0.5, palette: ['08306b', '08519c', '2171b5', '4292c6', '6baed6', '9ecae1', 'c6dbef', 'deebf7', 'f7fbff']}
Map.addLayer(linearSDB, sbd_vis, "linearSDB",0)


//  --------------- E X P O R T ---------------------------------------------------   //
/*
Export.image.toDrive({
  image: linearSDB,
  description: "LinearSDB",
  scale: 4.77,
  maxPixels: 551733655,
});

Export.image.toDrive({
  image: nicfi_masked,
  description: "nicfi_masked",
  scale: 4.77,
  maxPixels: 551733655,
});


var projection = linearSDB.select('sdb').projection().getInfo();
*/

// Export the image to an Earth Engine asset.
Export.image.toAsset({
  image: linearSDB,
  description: 'SDB_LR',
  assetId: 'SDB_LR',
  region: geometry,
});

