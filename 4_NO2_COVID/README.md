# The comparison of NO2 in Denmark, March 2019 vs March 2020.

Launched in October 2017, Sentinel-5P is part of a fleet of satellites central to Copernicus, Europe’s environmental monitoring programme. With a resolution of up to 7 x 3.5 km, Sentinel-5P’s Tropomi instrument can detect air pollution over individual cities. Tropomi also has the capacity to locate where pollutants are being emitted, effectively identifying pollution hotspots

Playing a bit in Google Earth Engine with comparison of NO2 in Denmark, March 2019 and March 2020.

Please note, the interval chosen in the legend is very narrow to emphasize the local variations in DK

Sentinel-5 Precursor is a satellite launched on 13 October 2017 by the European Space Agency to monitor air pollution. The onboard sensor is frequently referred to as Tropomi (TROPOspheric Monitoring Instrument).

You can even [link to CODE!](https://github.com/sulova/NO2_COVID/blob/main/NO2_Denmark.js)

*Denmark, March 2019 vs March 2020.*


![Image](https://github.com/sulova/GEE/4_NO2_COVID/NO2.jpg)

```javascript
var area = ee.FeatureCollection("USDOS/LSIB/2013").filterMetadata("cc","equals","DA");
Map.addLayer(area,{}, 'AOI',1);
Map.centerObject(area,6);

// import collection
var s5 = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2")

// get no2 concentration BEFORE
var no2 = s5.filterDate("2019-03-01","2019-03-31").select("NO2_column_number_density").mean().clip(area);
Map.addLayer(no2,{min:0.00007,max:0.00011, palette:"green,yellow,orange,red,black"},"NO2 - BEFORE LOCKDOWN",1,1);

// get no2 concentration AFTER
var no2 = s5.filterDate("2020-03-01","2020-03-31").select("NO2_column_number_density").mean().clip(area);
Map.addLayer(no2,{min:0.00007,max:0.00011,palette:"green,yellow,orange,red,black"},"NO2 - AFTER LOCKDOWN",1,1);

```
