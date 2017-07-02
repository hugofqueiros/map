MapBox seems a good choice for the mapping system, among the advantages you can find:
- WebGl for map rendering
- Vector tiles
- Maps size is a lot lower than others (at least from what I read)
- Data-drive styling (https://blog.mapbox.com/introducing-data-driven-styling-in-mapbox-gl-js-f273121143c3)
- Max Box Studio seems to be a great tool for styling and customizing maps

A second reason is that I never worked with MapBox before so it seemed a perfectly good reason to learn. I had previously done some work with google maps and Leaflet.

I am still trying to find a good benchmark comparing the varius libs


The right of the bat solution that seemed more appropriate to deal with the large amount of geometries points was the clustering solution.
Aggregating data in relation to a radius seemed the obvious solution for me.
I did add 2 more data styling solutions with markers and heatmap. Mapbox data styling solution with markers seemed to deal with geometries in a similar way has the clustering solution.
There is commented code for the markers solution that adds all the geometries to the map (comment the symbol markers propertie and uncomment the circles to try it out)
On the Markers Map if you hover a marker a tooltip will appear showing data provided from the geojson file.
Map also shows buildings at a high value of zoom.



