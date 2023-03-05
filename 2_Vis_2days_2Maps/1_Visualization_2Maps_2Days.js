// Display a grid of linked maps, each with a different visualization.
var date_1 = ee.Date('2022-01-01')
var date_2 = ee.Date('2023-01-01')
var lon = 12.00
var lat = 55.00 
var zoom = 8

var Start_period = ee.Date('2018-01-01')
var End_period = ee.Date(new Date().getTime())

function renderSlider(dates) {
  var slider = ui.DateSlider({start: dates.start.value, end: dates.end.value, period: 1, onChange: renderDateRange})
  Map.add(slider)}

function renderDateRange(dateRange) {
  var image = sentinel_dataset.filterDate(dateRange.start(), dateRange.end()) 
  var vis = {min: 0, max: 2100}  
  var layer = ui.Map.Layer(image, vis, 'RGB',1)
  Map.layers().reset([layer])
  print(dateRange)}


// Create an initial mosiac, which we'll visualize in a few different ways.
var image_0 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterDate(date_1,  date_1.advance(1, 'day'))
    // Scale the images to a smaller range, just for simpler visualization.
    .map(function f(e) { return e.divide(10000); });
    
var image_1 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterDate(date_2,  date_2.advance(1, 'day'))
    // Scale the images to a smaller range, just for simpler visualization.
    .map(function f(e) { return e.divide(10000); });

// Each map has a name and some visualization parameters.
var MAP_PARAMS = {'S2 - Date 1': ['B4', 'B3', 'B2'],
                  'S2 - Date 2': ['B4', 'B3', 'B2']};

// Shared visualization parameters for the images.
function getVisualization(bands) {return {gamma: 1.3, min: 0, max: 0.3, bands: bands}}


/*Configure maps, link them in a grid*/
// Create a map for each visualization option.
var maps = [];

var image=[image_0,image_1];
Object.keys(MAP_PARAMS).forEach(function(name, index) {
  var map = ui.Map();
  map.add(ui.Label(name));
  map.addLayer(image[index], getVisualization(MAP_PARAMS[name]), name);
  map.setControlVisibility(false);
  maps.push(map)});

var linker = ui.Map.Linker(maps);

// Enable zooming on the top-left map.
maps[0].setControlVisibility({zoomControl: true});

// Create a grid of maps.
var mapGrid = ui.Panel(
    [ui.Panel([maps[0], maps[1]], null, {stretch: 'both'})],
    ui.Panel.Layout.Flow('vertical'), {stretch: 'both'});

maps[0].setCenter(lon, lat , zoom);


// Create a title.
var title = ui.Label('Sentinel-2', {
  stretch: 'horizontal',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '24px'
});

// Add the maps and title to the ui.root.
ui.root.widgets().reset([title, mapGrid]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));
