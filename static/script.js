var chart, submap, map, slider, MAP_WIDTH = 600,
    MAP_HEIGHT = 800,
    MAP_SCALE = 5000,//2400;
    COLORMAP = 'YlOrRd', // 'YlGnBu'
    START_YEAR = 1997,
    END_YEAR = 2012,
    END_YEAR_PAUSE = 10000;//
    DEFAULT_REGION = 'East Sussex',//'Brighton and Hove';//'London',
    BACKGROUND_COLOR = '#ddd',
    UPDATE_DT = 2000
;

var correctScaleTrans = function(_map, features) {
    var height = _map.height(), width = _map.width();
    _map.projection.scale(1).translate([0, 0]);

    // Create a path generator.
    var path = d3.geo.path()
        .projection(_map.projection);

    // Compute the bounds of a feature of interest, then derive scale & translate.
    var b = path.bounds(features),
    s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    _map.projection.scale(s).translate(t);
};


d3.json('static/data/eng_boundaries.json', function(error, EngMap) {
    d3.json('static/data/eng_house-prices.json', function(error, EngHousePrices) {
        'use strict';
        var norm_year = START_YEAR,
            year = START_YEAR,
            region = DEFAULT_REGION,
            ratio = 1,
            EngHousePricesMap = d3.map(),
            RegionsFeatureMap = d3.map()
        ;
       
        topojson.feature(EngMap, EngMap.objects.layer1).features.forEach(function(d) {
            RegionsFeatureMap.set(d.id, d);
        });
        EngHousePrices.forEach(function(d) {
            EngHousePricesMap.set(d.id, d);
        });
        
        // MAIN MAP
        map = new kcharts.BasicChart(
            {'height': MAP_HEIGHT, 'width': MAP_WIDTH, 'scale': MAP_SCALE}
        );

        map.colors = d3.scale.quantize().domain([1,15]).range(colorbrewer[COLORMAP][9]);
        
        map.projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(map.scale())
            .translate([map.width() / 2, map.height() / 2]);
        
        var getRegionHPMWRatio = function(id, _year) {
            _year = typeof _year !== 'undefined'? _year: year;

            var ratio, hps = EngHousePricesMap.get(id),
                hpsCurrent = hps[_year];
            // if there's no data we default to English house-prices
            if(hps[norm_year] === "" || hpsCurrent === ""){ 
                ratio = +EngHousePricesMap.get('England')[norm_year]/+EngHousePricesMap.get('England')[_year];
            }
            else{
                ratio = +hps[norm_year]/+hpsCurrent; 
            }
            
            return ratio;
        };
        
        map.cartogram = d3.cartogram()
            .projection(map.projection)
            .value(function(d) {
                d.ratio =  getRegionHPMWRatio(d.id);
                if(d.ratio < 0.000000001){
                    console.log(JSON.stringify(d));
                    console.log(JSON.stringify(hps));
                } 
                return d.ratio;
            })
        ;
        
        map.path = d3.geo.path()
            .projection(map.projection); 
        
        map.build = function() {
            var bb, sEnter;
            map.subunits = topojson.feature(map.data(), map.data().objects.layer1);
            map.features = map.subunits.features;
            map.featuresCarto = map.cartogram(map.data(), map.data().objects.layer1.geometries).features;
            // get height and width from parent box
            bb = map.container.node().parentNode.getBoundingClientRect();
            map.height(bb.height);
            map.width(bb.width);
            map.container
                .attr('height', bb.height)
                .attr('width', bb.width);
            correctScaleTrans(map, map.subunits);
            
            sEnter = map.svg.selectAll(".map-path")
                .data([true]).enter()
            ;
            sEnter
                .append('path')
                .attr('class', 'map-path')
            ;

            map.background = sEnter.append('g')
                .attr('id', 'backround-map');
                
            map.background.datum(map.subunits)
                .append('path')
                .attr('d', map.path)
                .attr('fill', BACKGROUND_COLOR)
            ;
            
            map.regions = sEnter.append('g')
                .attr('id', 'regions')
                .selectAll('path');
            
            map.regions = map.regions
                .data(map.features)
                .enter().append("path")
                .attr("class", "uk-region")
                .attr("d", map.path)
                .on("click", function(d, i) {
                    console.log("You pressed " + d.id + ' with a ratio of ' + d.ratio);
                    console.log(JSON.stringify(EngHousePricesMap.get(d.id)));
                    region = d.id;
                    submap.update();
                    chart.update();
                })
                .attr('cursor', 'pointer')
            ;

            map.regions.append('svg:title').text(function(d) {
                return d.id + ', HP/HW = ' + EngHousePricesMap.get(d.id)[year];
            });
        };

        map.update = function(_year) {
            year = typeof _year !== 'undefined'? _year: year;

            var features, path;
            if(map.warpOn){
                features = map.cartogram(map.data(), map.data().objects.layer1.geometries).features;
                path = map.cartogram.path;
            }
            else{
                features = map.features;
                path = map.path;
            }
            map.regions.data(features);
            map.regions.transition()
                .duration(750)
                .ease('linear')
                .attr('d', path)
                .attr('fill', function(d) {
                    return map.colors(+EngHousePricesMap.get(d.id)[year]);
                })
            ;
            
            d3.select('span#current').html(year);

            submap.update();
            chart.update();
            slider.update();
        };

        // SELECTED REGION MAP
        submap = new kcharts.BasicChart(
            {'height': MAP_HEIGHT, 'width': MAP_WIDTH, 'scale': MAP_SCALE}
        );
        // projection  
        submap.projection = d3.geo.albers();
        
        submap.path = d3.geo.path()
            .projection(submap.projection); 

        submap.build = function() {
            var bb = submap.container.node().parentNode.getBoundingClientRect();
            submap.height(bb.height);
            submap.width(bb.width);
            submap.features = topojson.feature(submap.data(), submap.data().objects.layer1).features;
            submap.container
                .attr('height', bb.height)
                .attr('width', bb.width);
            submap.colors = map.colors;
            submap.bigMap = submap.svg.append('path').attr('id', 'bigMap'); 
            submap.smallMap = submap.svg.append('path').attr('id', 'smallMap'); 
        };
        
        submap.update = function() {
            var sTemp,
                feature = RegionsFeatureMap.get(region),
                ratio = getRegionHPMWRatio(region);
            
            correctScaleTrans(submap, feature);
            
            submap.bigMap.datum(feature)
                .attr('d', submap.path)
                .attr('fill', BACKGROUND_COLOR)
            ;

            // MAP SCALED BY HP->MW ration
            submap.smallMap.datum(feature)
                .attr('d', submap.path)
                .attr('fill', function(d) {
                    return map.colors(+EngHousePricesMap.get(d.id)[year]);
                })
                .attr('transform', function(d) {
                    var centroid = submap.path.centroid(d),
                    x = centroid[0],
                    y = centroid[1];
                    return "translate(" + x + "," + y + ")" +
                        "scale(" + Math.sqrt(ratio) + ")" +
                        "translate(" + -x + "," + -y + ")";
                })
            ;
            d3.select('#sub-chart-title')
                .html(feature.id);

            // chart.update();
        };

        // REGION LINE CHART
        var lineData = [], r = d3.range(1997, 2013);
        var makeLineData = function(areas) {
            lineData.length = 0;
            areas.forEach(function(area) {
                var ad = EngHousePricesMap.get(area);
                r.forEach(function(d) {
                    lineData.push({'year':d, 'id':ad.id, 'value':ad[d]});
                }); 
            });
        };
                          
        makeLineData(['England', DEFAULT_REGION]);
        
        var svg = dimple.newSvg('#sub-chart-graph', 380, 350);
        chart = new dimple.chart(svg, lineData);
        
        var yearMarker1 = chart.svg.append('circle')
            .attr('r', 5).attr('stroke', 'red').attr('stroke-width', 3).attr('fill-opacity', 0);
        var yearMarker2 = chart.svg.append('circle')
            .attr('r', 5).attr('stroke', 'red').attr('stroke-width', 3).attr('fill-opacity', 0);
        
        chart.setBounds(40, 20, 320, 200);
        var x = chart.addCategoryAxis("x", "year"),
        // x.addOrderRule("Date");
        y = chart.addMeasureAxis("y", "value");
        y.title = "H-Price / H-Income";
        
        chart.addLegend(60, 10, 250, 20, "right");
        chart.getDimpleLineMarkerPos = function(region, year) {
            var rclass = region.toLowerCase().replace(/ /g, '-');
            var c = d3.select('circle.dimple-' + year + '.dimple-' + rclass); 
            return {x: c.attr('cx'), y: c.attr('cy')};
        };

        chart.setYearMarker = function(marker, region, year) {
            var pos = chart.getDimpleLineMarkerPos(region, year);
            marker.attr('cx', pos.x);
            marker.attr('cy', pos.y);
        };

        chart.drawLineMarkers = function() {
            chart.setYearMarker(yearMarker1, 'England', year);
            chart.setYearMarker(yearMarker2, region, year);
        };
        
        chart.update = function() {
            makeLineData(['England', region]);
            chart.draw(1000);
            // chart.drawLineMarkers();
        };
        
        var series = chart.addSeries("id", dimple.plot.line);
        series.afterDraw = function(s, d) {
            try{
                chart.drawLineMarkers(); 
            }
            catch(e){
                console.log('Dimple error: ' + e);
            }
        };
        chart.draw();

        
        // BUTTONS
        map.warpOn = true;
        var warpBtn = function(btn) {
            map.warpOn = this.on;
            map.update();
        },
        resetBtn = function(btn) {
            year = START_YEAR;
            map.update();
        };
        map.anim = false;
        var animTimer, animTimeout,
            runAnim = function() {
                map.update();
                year += 1;
                // pause at the end of the run
                if(year > END_YEAR){
                    year = START_YEAR;
                    clearInterval(animTimer);
                    animTimeout = setTimeout(function() {
                        animTimer = setInterval(runAnim, UPDATE_DT);
                    }, END_YEAR_PAUSE); 
                }
            },
        animBtn = function(btn) {
            map.anim = this.on;
            if(map.anim){
                animTimer = setInterval(runAnim, UPDATE_DT);
            }
            else{
                clearTimeout(animTimeout);
                clearInterval(animTimer);
            }
        };
        
        var buttons = [
            {'on': map.warpOn, 'text': 'warp off', 'offText': 'warp on', 'cbk': warpBtn},
            {'text':'Reset', 'cbk':resetBtn},
            {'on': map.anim, 'text': 'stop', 'offText': 'animate', 'cbk': animBtn},
        ];

        d3.select('#buttons').selectAll('buttons').data(buttons).enter()
            .append('button')
            .attr('class', 'btn btn-primary')
            .attr('id', function(d) {
                return d.text.toLowerCase().replace(/ /g, '-');
            })
            .text(function(d) {
                // a toggle button?
                if(d.hasOwnProperty('on')){
                    if(d.on){return d.text;}
                    return d.offText;
                }
                return d.text;
            })
            .on('click', function(d) {
                // is this a toggle-button?
                if(d.hasOwnProperty('on')){
                    var txt = d.on?d.offText:d.text;
                    d.on = !d.on;
                    d3.select(this).text(txt);
                }
                d.cbk(this);
            })
        ;

        // LEGENDS, COLORBARS etc..
        var cbar = new kcharts.ColorBar()
            .title('H-Price / H-Income')
            .height(150)
            .width(20)
            .x(50)
            .y(250)
            .numBars(20)
            .horizontal(false)
            .colorScale(map.colors);
        slider = d3.slider().axis(true)
            .min(1997).max(2012).step(1).value(1997)
            .on('slide', function(evt, val) {
                year = +val;
                map.update();
            });
        
        slider.update = function() {
            slider.value(year);
            d3.select('#year-slider').html('').call(slider);
        };
        
        d3.select('#year-slider').call(slider);
        d3.select('#main-chart').datum(EngMap).call(map).call(cbar); 
        d3.select('#sub-chart').datum(EngMap).call(submap); 
        map.update();
    });
});
