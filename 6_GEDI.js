var samples = ee.FeatureCollection("projects/geo4gras/assets/rio-segura/GEDI_variables_20");

print(samples.size(), samples.first())
var tall = samples.filter(ee.Filter.gt('rh98', 12))
Map.addLayer(tall, {}, 'Tall trees')

// Need an additional property
var rawGedi = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").qualityMosaic('rh98')
Map.addLayer(rawGedi, {}, 'Raw Gedi')


// Combining Attributes
var samples_shot = rawGedi.select(['shot_number'])
.reduceRegions({
  collection:samples, 
  reducer:ee.Reducer.first(), 
  scale:25})
.map(function(f){return f.set('beam_id2', f.getNumber('first').format().slice(0,6),
                              'beam_id1', f.getNumber('first').format().slice(0,5),
                              'shot_number', f.getNumber('first').format().slice(10,17))})

print("extra", samples_shot.size())

var samples_shot_tall = samples_shot.filter(ee.Filter.gt('rh98', 12))
print("samples_shot_tall", samples_shot_tall.size(),
samples_shot_tall.aggregate_histogram('first'),
samples_shot_tall.aggregate_histogram('beam_id1'),
samples_shot_tall.aggregate_histogram('beam_id2'),
samples_shot_tall.aggregate_histogram('shot_number'))

// Filter_bias_beams

var samples_filter = samples_shot.filter(ee.Filter.neq('first', 60900500300404928)) 
var samples_filter = samples_filter.filter(ee.Filter.neq('first', 60900800300403952))
var samples_filter = samples_filter.filter(ee.Filter.lt('rh98',18))

print("samples_filter", samples_filter.size())

// Bands remove
var band_Names = samples_filter.first().propertyNames().removeAll(["SAR2120_HH", "SAR2120_HV", "first"])
var samples_filter = samples_filter.select(band_Names)  


print( samples_filter.size(), samples_filter.first() )
Export.table.toAsset({collection:samples_filter, description:"GEDI_variables_20_Filter", assetId:"rio-segura"})
