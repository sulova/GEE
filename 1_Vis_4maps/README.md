# 4 WINDOWS in GEE

- **Visualization of 4 maps WITHOUT a legend for each**

```javascript
var image=[otsu_1,otsu_2,otsu_3,otsu_4];

// Create a map for each visualization option.
var maps = [];
image.forEach(function(name, index) {
  var map = ui.Map();
  //map.add(ui.Panel(pan[index]))
  //map.add(ui.Label(NAMES[index],{palette:"white,blue"})); 
  map.addLayer(image[index],{palette:"white,blue"});
  map.addLayer(Area3);
  map.setControlVisibility(false);
  maps.push(map);});

var linker = ui.Map.Linker(maps);

maps[0].setControlVisibility({scaleControl: true});
maps[1].setControlVisibility({scaleControl: true});
maps[2].setControlVisibility({scaleControl: true});
maps[3].setControlVisibility({scaleControl: true});

// Create a grid of maps.
var mapGrid = ui.Panel(
  [ ui.Panel([maps[0],maps[1]], null, {stretch: 'both'}),
    ui.Panel([maps[2],maps[3]], null, {stretch: 'both'})],
    ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'});

// Add the maps and title to the ui.root.
ui.root.widgets().reset([mapGrid]);

// Center the maps near Area3.
maps[0].centerObject(Area3,13) 
```
- **Visualization of 4 maps WITH a legend for each**

``` Javascript
//__Legend1
var palette1 = viz1
var legend1 = ui.Panel({style: {position: 'middle-right',padding: '0px 0px'}});
var legendTitle = ui.Label({value: 'Elevation',style: {fontWeight: 'bold',fontSize: '12px',margin: '0 0 0 0',padding: '0'}});
legend1.add(legendTitle);
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((palette1.max-palette1.min)/100.0).add(palette1.min);
var legendImage = gradient.visualize(palette1);
var panel = ui.Panel({widgets: [ui.Label(palette1['max']+'m')],});
legend1.add(panel);
var thumbnail = ui.Thumbnail({image: legendImage,params: {bbox:'0,0,10,90', dimensions:'10x60'},
                    style: {margin: '0 0 0 0', padding: '0', position: 'middle-left'}});
legend1.add(thumbnail);
var panel = ui.Panel({widgets: [ui.Label(palette1['min']+'m')],});
legend1.add(panel);
//__Legend2
var palette2 = viz2
var legend2 = ui.Panel({style: {position: 'middle-right',padding: '0px 0px'}});
var legendTitle = ui.Label({value: 'Slope',style: {fontWeight: 'bold',fontSize: '12px',margin: '0 0 0 0',padding: '0'}});
legend2.add(legendTitle);
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((palette2.max-palette2.min)/100.0).add(palette2.min);
var legendImage = gradient.visualize(palette2);
var panel = ui.Panel({widgets: [ui.Label(palette2['max']+'°')],});
legend2.add(panel);
var thumbnail = ui.Thumbnail({image: legendImage,params: {bbox:'0,0,10,90', dimensions:'10x60'},
                 style: {margin: '0 0 0 0', padding: '0', position: 'middle-left'}});
legend2.add(thumbnail);
var panel = ui.Panel({widgets: [ui.Label(palette2['min']+'°')],});
legend2.add(panel);
//__Legend3
var palette3 = viz3
var legend3 = ui.Panel({style: {position: 'middle-right',padding: '0px 0px'}});
var legendTitle = ui.Label({value: 'Aspect',style: {fontWeight: 'bold',fontSize: '12px',margin: '0 0 0 0',padding: '0'}});
legend3.add(legendTitle);
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((palette3.max-palette3.min)/100.0).add(palette3.min);
var legendImage = gradient.visualize(palette3);
var panel = ui.Panel({widgets: [ui.Label(palette3['max']+'°')],});
legend3.add(panel);
var thumbnail = ui.Thumbnail({image: legendImage,params: {bbox:'0,0,10,90', dimensions:'10x60'}, style: {margin: '0 0 0 0', padding: '0', position: 'middle-left'}});
legend3.add(thumbnail);
var panel = ui.Panel({widgets: [ui.Label(palette3['min']+'°')],});
legend3.add(panel);

//________________4 Windows__________________
var image=[ndvi,elevation,slope,aspect];

//var NAMES = ['NDVI','Elevation','Slope','Aspect'];

var VIS_PARAMS = [viz,viz1,viz2,viz3];

var pan = [legend,legend1,legend2,legend3];

// Create a map for each visualization option.
var maps = [];
pan.forEach(function(name, index) {
  var map = ui.Map();
  map.add(ui.Panel(pan[index]))
  //map.add(ui.Label(NAMES[index])); 
  map.addLayer(Australia);
  map.addLayer(image[index], VIS_PARAMS[index]);
  map.setControlVisibility(false);
  maps.push(map);});

var linker = ui.Map.Linker(maps);

maps[0].setControlVisibility({scaleControl: true});
maps[1].setControlVisibility({scaleControl: true});
maps[2].setControlVisibility({scaleControl: true});
maps[3].setControlVisibility({scaleControl: true});


// Create a grid of maps.
var mapGrid = ui.Panel(
  [ ui.Panel([maps[0],maps[1]], null, {stretch: 'both'}),
    ui.Panel([maps[2],maps[3]], null, {stretch: 'both'})],
    ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'});

// Add the maps and title to the ui.root.
ui.root.widgets().reset([mapGrid]);
//ui.root.widgets([legend]);

// Center the maps near Sacramento.
maps[0].centerObject(Australia,3.5);
```

![Image](https://github.com/sulova/GEE/main/1_Vis_4maps/4maps.PNG)
