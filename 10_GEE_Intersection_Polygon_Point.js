var geometry = ee.Geometry.MultiPoint([[-1.1493957239404233,38.258012395211765]]);

//_____Input Points Variables__________
var samples = ee.FeatureCollection("projects/ee-sulovaandrea/assets/Segura/GEDI_var21_10");
Map.addLayer(samples, {min:0,max:2000}, 'GEDI',1);
Map.centerObject(geometry,14); 
print("Size of training samples:",samples.size())
print(samples.first())

//_____Input Parcels Variables__________
var parcels = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/crop/crop_2021")
var parcels_perm = parcels.filter(ee.Filter.eq('Training', "P"))
print("Size of training parcels:",parcels.size())
Map.addLayer(parcels_perm, {}, 'Parcels',1);


// Define a spatial filter as geometries that intersect.
var spatialFilter = ee.Filter.intersects({
  leftField: '.geo',
  rightField: '.geo',
  maxError: 10
});


// Define a save all join.
var saveAllJoin = ee.Join.saveAll({
  matchesKey: 'gedi_point',
});

// Apply the join.
var intersectJoined = saveAllJoin.apply(parcels_perm, samples, spatialFilter);

// Add power plant count per state as a property.
var intersectJoined = intersectJoined.map(function(ft){
                var total_point = ee.List(ft.get('gedi_point')).size();
                var rh98_Mean = ee.FeatureCollection(ee.List(ft.get('gedi_point'))).aggregate_mean('rh98')
                var rh98_Min = ee.FeatureCollection(ee.List(ft.get('gedi_point'))).aggregate_min('rh98')
                var rh98_Max = ee.FeatureCollection(ee.List(ft.get('gedi_point'))).aggregate_max('rh98')
                var rh98_sd = ee.FeatureCollection(ee.List(ft.get('gedi_point'))).aggregate_total_sd("rh98")
                return ft.set("rh98_Mean",rh98_Mean,
                              "rh98_Max",rh98_Max,
                              "rh98_Min",rh98_Min,
                              "rh98_sd",rh98_sd,
                              "Total_points", total_point)});
                              
var props = intersectJoined.first().propertyNames().removeAll(['gedi_point'])
var intersectJoined = intersectJoined.select(props)
print(intersectJoined)

Map.addLayer(intersectJoined, {}, 'intersectJoined',1);

print(intersectJoined.first())
print(intersectJoined.size())

// Make a bar chart for the number of power plants per state.
var chart = ui.Chart.feature.byFeature(intersectJoined, 'Seasons_T', 'total_points')
  .setChartType('ColumnChart')
  .setSeriesNames({n_power_plants: 'GEDI points per parcel'})
  .setOptions({
    title: 'GEDI points per parcel',
    hAxis: {title: 'Seasons_T'},
    vAxis: {title: 'Total_points'}});

// Print the chart to the console.
print(chart);


// Export the FeatureCollection.
Export.table.toDrive({
  collection: intersectJoined,
  description: 'perm_gedi_per_parcel',
  fileFormat: 'CSV'
});


