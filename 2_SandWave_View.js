
var date_start = '2015-01-15'
var date_end = '2017-03-30'
var S2_SR_cloud_scene = 30

var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[7.921178888963856, 54.05264639763684],
          [7.921178888963856, 53.44523844204421],
          [8.989599299120105, 53.44523844204421],
          [8.989599299120105, 54.05264639763684]]], null, false);

var criteria = ee.Filter.and(ee.Filter.bounds(geometry), ee.Filter.date(date_start, date_end));

var S2_SR = ee.ImageCollection('COPERNICUS/S2')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_SR_cloud_scene))
          .filter(criteria)
Map.centerObject(geometry)

print(S2_SR)        
//------ S2  SR  V I S U A L I Z A T I O N ----------------------

var list_S2_SR = S2_SR.toList(S2_SR.size());
print()
var size_SR = S2_SR.size()
var visParams = {bands:["B4","B3","B2"],min:0,max:3000, gamma:1.5}; 

for(var i = 0; i < size_SR.getInfo(); i++){
  var image = ee.Image(list_S2_SR.get(i));
  var image = image.clip(geometry);
  var date = image.date().format('yyyy-MM-dd').getInfo();
  Map.addLayer(image, visParams, i.toString()+"_S2_SR" + date.toString(), true)
  }

// Slider helping go through scenes
var slider = ui.Slider();
slider.onSlide(function(value) {
  var int_value = value * (Map.layers().length() - 1) >> 0;
  Map.layers().get(int_value);
  for (var i = int_value + 1; i < Map.layers().length(); i++) {
    Map.layers().get(i).setOpacity(0);}});

print(slider)
  
            
