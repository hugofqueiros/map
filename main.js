var color = '#51bbd6';
var mapStyle = 'light';
var zoomThreshold = 14;
var dataStyle = 'cluster';
var circleRadius = 5;

mapboxgl.accessToken = 'pk.eyJ1IjoiaHVnb2ZxdWVpcm9zIiwiYSI6IkFHNnFpX28ifQ.q_0DqI9itRR3ezCyIR6ijA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/' + mapStyle + '-v9',
    center: [-6, 40],
    zoom: 2
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// Add Geocoder to the map
map.addControl(new MapboxGeocoder({
    accessToken: mapboxgl.accessToken
}), 'top-right');

// Create a popup (for the Markers type map)
var popup = new mapboxgl.Popup({
    closeButton: false
});

map.on('load', function() {
    var startup = document.getElementById('startup');
    var mapDiv = document.getElementById('map');
    var mapToolsDiv = document.getElementById('Map-tools');
    startup.style.display = 'none';
    mapDiv.style.visibility = 'visible';
    mapToolsDiv.style.visibility = 'visible';

    onLoadClusters();
});

map.on('zoom', function() {
    if (map.getZoom() > zoomThreshold) {
        map.setPitch(60);
        map.setBearing(-60);
    } else {
        map.setPitch(0);
        map.setBearing(0);
    }
});

var itemFill = document.getElementById('item-fill');
var itemStroke = document.getElementById('item-stroke');

var colorpickerFill = document.getElementById('colorpicker-fill');
var colorpickerStroke = document.getElementById('colorpicker-stroke');
var fillSize = document.getElementById('number-fill-size');
var strokeSize = document.getElementById('number-stroke-size');
var selectMapStyle = document.getElementById('select-map-style');
var selectDataStyle = document.getElementById('select-data-style');
colorpickerFill.value = color;
colorpickerStroke.value = color;
fillSize.value = circleRadius;
strokeSize.value = 0;
selectMapStyle.value = mapStyle;
selectDataStyle.value = dataStyle;

colorpickerFill.addEventListener('change', function() {
    setInterval(function () {
        map.setPaintProperty('clusters', 'circle-color', colorpickerFill.value);
    }, 0);
});

fillSize.addEventListener('change', function() {
    setInterval(function () {
        map.setPaintProperty('clusters', 'circle-radius', parseInt(fillSize.value, 10));
    }, 0);
});

colorpickerStroke.addEventListener('change', function() {
    setInterval(function () {
        map.setPaintProperty('clusters', 'circle-stroke-color', colorpickerStroke.value);
    }, 0);
});

strokeSize.addEventListener('change', function() {
    setInterval(function () {
        map.setPaintProperty('clusters', 'circle-stroke-width', parseInt(strokeSize.value, 10));
    }, 0);
});

selectMapStyle.addEventListener('change', function() {
    reloadMaps();
});

selectDataStyle.addEventListener('change', function() {
    reloadMaps();
});

function reloadMaps() {
    map.setStyle('mapbox://styles/mapbox/' + selectMapStyle.value + '-v9');

    var intervalId = setInterval(function() {
        onLoad(selectDataStyle.value);
        clearInterval(intervalId);
    }, 2000);
}

function onLoad(type) {
    switch(type) {
        case 'cluster':
            onLoadClusters();
            break;
        case 'heatmap':
            onLoadHeatmap();
            break;
        case 'markers':
            onLoadMarkers();
            break;
        case 'choropleth':
            onLoadChoropleth();
            break;
        default:
            onLoadClusters();
            break;
    }
}

function removeEvents() {
    map.off('click', 'markers', clickMarkers);
    map.off('mousemove', 'markers', mouseMove);
    map.off('mouseleave', 'markers', mouseLeave);
    map.off('click', 'clusters', clickClusters);
}

function onLoadClusters() {
    itemFill.style.visibility = 'visible';
    itemStroke.style.visibility = 'visible';

    removeEvents();

    map.addSource('cartodb', {
        type: 'geojson',
        data: 'cartodb-query.geojson',
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'cartodb',
        paint: {
            'circle-color': color,
            'circle-radius': circleRadius
        }
    });

    // text
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'cartodb',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    add3DLayer();

    map.on('click', 'clusters', clickClusters);
}

function onLoadHeatmap() {
    itemFill.style.visibility = 'hidden';
    itemStroke.style.visibility = 'hidden';
    removeEvents();

    map.addSource('cartodb', {
        type: 'geojson',
        data: 'cartodb-query.geojson',
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 30
    });

    var layers = [
        [0, 'green'],
        [10, 'orange'],
        [50, 'red']
    ];

    layers.forEach(function (layer, i) {
        map.addLayer({
            'id': 'cluster-' + i,
            'type': 'circle',
            'source': 'cartodb',
            'paint': {
                'circle-color': layer[1],
                'circle-radius': 70,
                'circle-blur': 1 // blur the circles to get a heatmap look
            },
            'filter': i === layers.length - 1 ?
                ['>=', 'point_count', layer[0]] :
                ['all',
                    ['>=', 'point_count', layer[0]],
                    ['<', 'point_count', layers[i + 1][0]]]
        }, 'waterway-label');
    });

    map.addLayer({
        'id': 'unclustered-points',
        'type': 'circle',
        'source': 'cartodb',
        'paint': {
            'circle-color': 'green',//'rgba(0,255,0,0.5)',
            'circle-radius': 70,
            'circle-blur': 1
        },
        'filter': ['!=', 'cluster', true]
    }, 'waterway-label');
}

function onLoadMarkers() {
    itemFill.style.visibility = 'hidden';
    itemStroke.style.visibility = 'hidden';
    removeEvents();

    map.addSource('cartodb', {
        type: 'geojson',
        data: 'cartodb-query.geojson',
    });

    map.addLayer({
        id: 'markers',
        interactive: true,
        source: 'cartodb',
//            type: 'circle',
//            paint: {
//                'circle-color': color,
//                'circle-radius': circleRadius
//            }
        'type': 'symbol',
        'layout': {
            'icon-image': 'marker-15',
            'icon-size': 1.25
        },
        'paint': {

        }
    });

    add3DLayer();

    map.on('click', 'markers', clickMarkers);
    map.on('mousemove', 'markers', mouseMove);
    map.on('mouseleave', 'markers', mouseLeave);
}

function add3DLayer() {
    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': {
                'type': 'identity',
                'property': 'height'
            },
            'fill-extrusion-base': {
                'type': 'identity',
                'property': 'min_height'
            },
            'fill-extrusion-opacity': .6
        }
    });
}

// ##### Events Handlers
var clickClusters = function(e) {
    var features = map.queryRenderedFeatures(e.point, {layer: 'clusters', radius: 1, includeGeometry: true});
    if(features.length) {
        map.flyTo({
            center: features[0].geometry.coordinates,
            zoom: 5,
            minZoom: 5
        });
    }
};

var clickMarkers = function(e) {
    var features = map.queryRenderedFeatures(e.point, {layer: 'markers', radius: 1, includeGeometry: true});
    if(features.length) {
        map.flyTo({
            center: features[0].geometry.coordinates,
            zoom: 5,
            minZoom: 5
        });
    }
};

var mouseMove = function(e) {
    map.getCanvas().style.cursor = 'pointer';

    var feature = e.features[0];
    popup.setLngLat(feature.geometry.coordinates)
        .setHTML(
            '<div class="Map-tooltip">' +
            '<h4>' + feature.properties.name+ '</h4>' +
            '<div>Latitude: ' + feature.properties.latitude + '</div>' +
            '<div>Longitude: ' + feature.properties.longitude + '</div>' +
            '<div>Pop Max: ' + feature.properties.pop_max + '</div>' +
            '<div>Pop Min: ' + feature.properties.pop_min + '</div>' +
            '<div>Pop Other: ' + feature.properties.pop_other + '</div>' +
            '</div>')
        .addTo(map);
};

var mouseLeave = function() {
    map.getCanvas().style.cursor = '';
    popup.remove();
};

