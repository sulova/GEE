// Load a Landsat 8 image, select the NIR band, threshold, display.
var image = ee.Image('LANDSAT/LC08/C02/T1_TOA/LC08_044034_20140318')
            .select(4).gt(0.2);
Map.setCenter(-122.1899, 37.5010, 13);
Map.addLayer(image.reproject({crs: 'EPSG:4326',scale: 20}), {}, 'NIR threshold');

// Define a kernel.
var kernel = ee.Kernel.circle({radius: 1});

// Perform an erosion followed by a dilation, display.
var opened = image
             .focalMin({kernel: kernel, iterations: 1})
             .focalMax({kernel: kernel, iterations: 1});
Map.addLayer(opened.reproject({crs: 'EPSG:4326',scale: 20}), {}, 'opened');
