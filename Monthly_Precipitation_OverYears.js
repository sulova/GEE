


var aoi = ee.FeatureCollection("projects/geo4gras/assets/EO-Clinic/AOI_Irrigation");
Map.centerObject(aoi, 7)
var years = ee.List.sequence(2017, 2022);
var months = ee.List.sequence(1, 12);
var Pre = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").select('precipitation');

// Map over the years and create a monthly totals collection
var monthlyImages = years.map(function(year) {
  return months.map(function(month) {
    var filtered = Pre.filter(ee.Filter.calendarRange(year, year, 'year'))
      .filter(ee.Filter.calendarRange(month, month, 'month'));
    var monthly = filtered.sum();
    return monthly.set({ 'month': month, 'year': year });
  });
}).flatten();

// We now have 1 image per month for the entire duration
var monthlyCol = ee.ImageCollection.fromImages(monthlyImages)


// convert our binary surface water extent data to area and set the date (needed for charts).
var monthlyCol = monthlyCol.map(function(i){
  var date = ee.Date.fromYMD(i.getNumber('year'), i.getNumber('month'), 1)
  var area = ee.Image.pixelArea().divide(1000000)
  return i.multiply(area).set('system:time_start', date.millis())
})


//______________GRAPHS____________
/// plot the timeseries grouped by year.
var doy_chart = ui.Chart.image.doySeriesByYear({
  imageCollection: monthlyCol, 
  bandName: 'precipitation', 
  region:aoi, 
  regionReducer:ee.Reducer.sum(), 
  scale:1000, 
  startDay:1, 
  endDay:365,
})
.setOptions({
  title: 'Precipitation during the year',
  vAxis: {title: "mm/d",viewWindow:{ min: 0 }},
  hAxis: {title: 'Day of year'},
  lineWidth: 2,
  interpolateNulls: true,
  curveType: 'function',
  is3D: true,
  chartArea: {backgroundColor: '#eeeaeb'},
  pointSize: 4,
})

print(doy_chart)



//________MAPS_________________________________________

// Monthly mean
var years = ee.List.sequence(2017, 2022);
var visPer = {min: 50, max:200, palette: ['f4f4f4', '6983aa','00bcd4','0000FF']};

// Define the time range
var start = ee.Date('2017-11-01');

for(var b = 0; b < years.size().getInfo(); b++) {
    var start_date = start.update({'year': years.get(b)})
    var end_date = start_date.advance(5, 'month');
    print(' season composite:', start_date, end_date)
    var precipitation = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").select('precipitation')
                    .filter(ee.Filter.date(start_date,end_date))
    print(years.get(b).getInfo().toString(), precipitation)
    var precipitation =precipitation.sum().int().clip(aoi);
    Map.addLayer(precipitation, visPer,'Precipitation_'+ years.get(b).getInfo().toString());
}

//_________________LEGEND_____________________________________________
var legend = ui.Panel({style: {position: 'middle-right',padding: '8px 10px'}});
var legendTitle = ui.Label({value: 'Precipitation (mm/day)',style: {fontWeight: 'bold',fontSize: '15px',margin: '5 0 9px 0',padding: '10'}});
legend.add(legendTitle);
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((visPer.max-visPer.min)/100.0).add(visPer.min);
var legendImage = gradient.visualize(visPer);
var panel = ui.Panel({widgets: [ui.Label(visPer['max'])],});
legend.add(panel);
var thumbnail = ui.Thumbnail({image: legendImage,params: {bbox:'0,0,10,90', dimensions:'20x70'},style: {padding: '1px', position: 'bottom-right'}});
legend.add(thumbnail);
var panel = ui.Panel({widgets: [ui.Label(visPer['min'])],});legend.add(panel);Map.add(legend);


