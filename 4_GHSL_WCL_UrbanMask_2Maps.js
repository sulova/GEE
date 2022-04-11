var geometry =  ee.Geometry.Polygon(
        [[[12.025620480477798, 55.962354943399625],
          [12.025620480477798, 55.459478591752045],
          [12.970444699227798, 55.459478591752045],
          [12.970444699227798, 55.962354943399625]]], null, false);


/// GHSL- Built-Up Multitemporal
var dataset = ee.Image('JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1');
var dataset = dataset.select('built').clip(geometry);
var mask = dataset.eq(6)
var visParams = { min: 1.0,  max: 6.0,  palette: ['0c1d60', '000000', '448564', '70daa4', '83ffbf', 'ffffff'],};
Map.setCenter(12.56, 55.63, 12);
Map.addLayer(dataset, visParams, 'GHSL- All', 0);
var GHSL = dataset.updateMask(mask)
var vis_GHSL = {pallete: 'orange'}
Map.addLayer(GHSL, vis_GHSL, 'GHSL- Built-Up ');


/// ESA - WorldCover
var dataset = ee.ImageCollection("ESA/WorldCover/v100").first().clip(geometry);
var mask = dataset.eq(50)
var vis_WCL = { bands: ['Map'],};
var WCL = dataset.updateMask(mask)
Map.addLayer(WCL, vis_WCL, "ESA WorldCover - Built-Up");


//__________M_______A________P _________________________________

var legend1 = ui.Panel({style: {position: 'middle-right',padding: '0px 0px'}});
var legendTitle = ui.Label({value: 'ESA WorldCover - Built-Up',style: {fontWeight: 'bold',fontSize: '12px',margin: '0 0 0 0',padding: '0'}});
legend1.add(legendTitle);

var legend2 = ui.Panel({style: {position: 'middle-right',padding: '0px 0px'}});
var legendTitle = ui.Label({value: 'GHSL- Built-Up',style: {fontWeight: 'bold',fontSize: '12px',margin: '0 0 0 0',padding: '0'}});
legend2.add(legendTitle);

var image=[WCL,GHSL];

var NAMES = ['WCL','GHSL'];

var VIS_PARAMS = [vis_WCL,vis_GHSL];
  

var pan = [legend1,legend2];

// Create a map for each visualization option.
var maps = [];
pan.forEach(function(name, index) {
  var map = ui.Map();
  map.setOptions('Satellite'); 
  map.add(ui.Panel(pan[index]))
  //map.add(ui.Label(NAMES[index])); 
  map.addLayer(image[index], VIS_PARAMS[index]);
  map.setControlVisibility(false);
  maps.push(map);});

var linker = ui.Map.Linker(maps);

maps[0].setControlVisibility({scaleControl: true});
maps[1].setControlVisibility({scaleControl: true});


// Create a grid of maps.
var mapGrid = ui.Panel(
  [ ui.Panel([maps[0],maps[1]], null, {stretch: 'both'})  ],
    ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'});

// Add the maps and title to the ui.root.
ui.root.widgets().reset([mapGrid]);


// Center the maps near Sacramento.
maps[0].centerObject(geometry,12);
