var geometry = ee.Geometry(Map.getBounds(true))
var scaledReducedl8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(geometry)
  .filterDate('2021-01-01', '2022-01-01') // End date is exclusive
  .select('ST_B10')
  .map(function (image) {
    return image.set('formattedDate', image.date().format('YYYYMMddHHmmss'))
  })

var chart = ui.Chart.image.series({
  imageCollection: scaledReducedl8,
  region: geometry.buffer(17),
  reducer: ee.Reducer.median(),
  xProperty: 'formattedDate'
}).setSeriesNames(['LST_median']);

print(chart)
