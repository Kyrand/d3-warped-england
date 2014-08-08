/* global $, _  */
(function(kcharts) {
    /* global $, d3*/
    "use strict";
    kcharts.Simple2D = function() {
        var that=this, params = this.params = {},
        margin = params.margin = {top: 30, right: 30, bottom: 30, left: 30};
        // params.width = 500 - margin.left - margin.right;
        // params.height = 500 - margin.top - margin.bottom;
        params.width = 500;
        params.height = 500;
        params.xDomain = null;
        params.yDomain = null;
        params.timeIndex = null;
        params.data = null;
        params.xLabel = 'x';
        params.yLabel = 'y';
        params.showHeatmapFlag = true;
        params.showLinePathFlag = true;
        params.COLS = ['red', 'green', 'blue'];
        
        // SETUP SCALES AND AXES 
        var x = d3.scale.linear(),
        y = d3.scale.linear(),
        xAxis = d3.svg.axis().scale(x).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left"),
        // OUR SINGLE LINE
        X = function(d) {return x(+d.x);},
        Y = function(d) {return y(+d.y);},
        line = d3.svg.line().x(X).y(Y),
        // heatmap
        heatmap = new kcharts.HeatMap().xScale(x).yScale(y).radius(0.02);

        var chart = function(selection) {
            selection.each(function(data) {
                var g, height = chart.height(), width = chart.width(), margin = chart.margin();
                chart.svg = d3.select(this)
                    .attr('width', width)
                    .attr('height', height)
                    .selectAll('g').data([data]);
                // MAKE CHART ELEMENTS IF NEC
                var gEnter = chart.svg.enter().append('g');
                gEnter.append("g").attr("class", "x axis");
                gEnter.append("g").attr("class", "y axis");
                gEnter.append("g").attr("class", "axes-labels");
                gEnter.append("g").attr("class", "lines");
                // gEnter.append("path").attr("class", "line");
                gEnter.append("g").attr("class", "time-markers");
                // genter.append("text").attr("class", "x-label");
                // gEnter.append("text").attr("class", "y-label");
                // UPDATE DOMAINS
                x.domain(chart.xDomain() || kcharts.getDataExtent(data, 'x'))
                    .range([0, width - margin.left - margin.right]);
                y.domain(chart.yDomain() || kcharts.getDataExtent(data, 'y'))
                    .range([height - margin.top - margin.bottom, 0]);
                // UPDATE DIMENSIONS
                g = chart.svg
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr("class", "chart-area")
                    .attr("width", width - margin.left - margin.right)
                    .attr("height", height - margin.top - margin.bottom);
                ;
                // UPDATE THE AXES 
                g.select('.x.axis')
                    .attr("transform", "translate(0," + y.range()[0] + ")")
                    .transition().duration(1000).call(xAxis);
                g.select('.y.axis').transition().duration(1000).call(yAxis);
                // UPDATE LABELS
                g.data([{'xText':chart.xLabel(), 'yText':chart.yLabel()}]).call(kcharts.axesLabels);
                // UPDATE THE LINE
                if(chart.showLinePathFlag()){
                    var lEnter = g.select('.lines').selectAll('path').data(data).enter();
                    lEnter.append("path").attr('stroke', chart.colors);
                    g.selectAll('.lines path').attr('d', line);
                }
                // UPDATE HEATMAP
                if(chart.showHeatmapFlag()){
                    d3.select(this).call(heatmap);
                }
                // UPDATE THE TIME-MARKER
                var tEnter = g.select('.time-markers')
                    .selectAll('.time-marker').data(data).enter();
                tEnter.append('circle').attr('class', 'time-marker').attr('fill', chart.colors);
                g.selectAll('.time-markers .time-marker')
                    .attr('cx', function(d) {
                        return parseInt(x(d[d.length-1].x), 10);
                    })
                    .attr('cy', function(d) {
                        return parseInt(y(d[d.length-1].y), 10);
                    })
                    .attr('r', 5)
                ;
            });
        };

        var method;
        for(method in this.params){
            chart[method] = makeAPIMethod(chart, this, method);
        }
        
        chart.margins = function(_) {
            if(!arguments.length){
                return that.params.margins;
            }
            $.extend(that.params.margins, _);
            return chart;
        };

        chart.xScale = function() {
            return x;
        };
        
        chart.yScale = function() {
            return y;
        };

        chart.colors = function(d, i) {
            return chart.COLS()[i%chart.COLS().length];
        };

        return chart;
    };

    var makeAPIMethod = function(chart, that, method) {
        return function(_){
            if(!arguments.length){
                return that.params[method];
            }
            that.params[method] = _;
            return chart;
        };
        
    };

    kcharts.getDataExtent = function(data, col){
        return d3.extent(data.map(function(d) {
            return +d[col];
        }));
    };

    kcharts.parentData = function(d) {
        return [d];
    };

    kcharts.axesLabels = function(selection) {
        selection.each(function(data){
            // var gEnter, g = d3.select(this), svg = d3.select(g.property("nearestViewportElement")),
            var gEnter, svg = d3.select(this),
            width = svg.attr('width'),
            height = svg.attr('height'),
             
            axesLabels = svg.select('.axes-labels');
            gEnter = axesLabels.selectAll('.x.label').data(kcharts.parentData).enter();
            gEnter.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end");
            svg.selectAll('.x.label')
                .attr("x", width)
                .attr("y", height - 6)
                .text(function(d) {
                    return d.xText;
                });
            // And the y-axis label like this:
            gEnter = axesLabels.selectAll('.y.label').data(kcharts.parentData).enter();
            gEnter.append("text")
                .attr('class', 'y label')
                .attr("y", 6)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .attr("text-anchor", "end")
            ;
            svg.selectAll('.y.label')
                .text(function(d) {
                    return d.yText;
                });
            
        });
    };

    var makeAPIMethod = function(chart, that, method) {
        return function(_){
            if(!arguments.length){
                return that.params[method];
            }
            that.params[method] = _;
            return chart;
        };
        
    };

    kcharts.BasicChart = function(params) {
        this.params = typeof params !== 'undefined'? params: {
            height:100, width:100
        };
        this.params.data = {};
 
        var method, that = this,
        
        chart = function(selection) {
            selection.each(function(data) {
                var g, height = chart.height(), width = chart.width();
                chart.data(data);
                chart.container = d3.select(this);
                chart.svg = d3.select(this)
                    .attr('width', width)
                    .attr('height', height)
                    .selectAll('g').data([data]);
                chart.gEnter = chart.svg.enter().append('g');
                chart.build();
            });
        };

        for(method in this.params){
            chart[method] = makeAPIMethod(chart, this, method);
        }
        
        chart.build = function() {
            
        };
        
        return chart;
    };

    kcharts.BasicPlugin = function(params) {
        this.params = typeof params !== 'undefined'? params: {
            height:100, width:100
        };
        this.params.data = {};
 
        var method, that = this,
        
        plugin = function(selection) {
            selection.each(function(data) {
                var g, height = plugin.height(), width = plugin.width();
                plugin.data(data);
                plugin.container = d3.select(this);
                plugin.svg = d3.select(this)
                    .selectAll('g').data([data]);
                
                plugin.gEnter = plugin.svg.enter()
                    .append('g').attr('class', plugin.type() || 'plugin');
                plugin.build();
            });
        };

        for(method in this.params){
            plugin[method] = makeAPIMethod(plugin, this, method);
        }
        
        plugin.build = function() {
            
        };
        
        return plugin;
    };
    
    kcharts.COLS = {'blue': '#4575b4', 'yellow': '#ffffbf', 'red': '#a50026'};
    var COLOR_BARS = 50;
    kcharts.ColorBar = function(){
        var cbar = new kcharts.BasicPlugin({
            type: 'colorbar',
            title: '',
            horizontal: false,
            width: 10,
            height: false,
            barHeight:2,
            x: 0,
            y: 0,
            numBars: COLOR_BARS,
            domain: [0, COLOR_BARS/2, COLOR_BARS],
            crange: [kcharts.COLS.blue, kcharts.COLS.yellow, kcharts.COLS.red],
            range: [0, 100],
            colorScale: d3.scale.linear().interpolate(d3.interpolateHcl),
            labelIndices:false,
            bounds: false
        });

        cbar.cbarscale = d3.scale.linear()
            .domain([0, COLOR_BARS]).range(cbar.range());
        cbar.colorScale()
            .domain(cbar.domain()).range(cbar.crange());
        
        cbar.setScales = function() {
            var domain = cbar.colorScale().domain();
            cbar.bounds([domain[0], domain[domain.length-1]]);
            cbar.cbarscale.domain([0, cbar.numBars()]).range(cbar.bounds());
            if(!cbar.labelIndices()){
                cbar.labelIndices([0, cbar.numBars()/2, cbar.numBars()-1]);
            }
        };
        
        cbar.build = function() {
            var cEnter, bars, cbars, eles;
            // scale to map colorbar domain to data domain (range) 
            cbar.setScales();
            if(cbar.height()){cbar.barHeight(cbar.height()/cbar.numBars());} 
                
            // ADD COLORBAR ELEMENTS
            cbars = cbar.svg.selectAll('.colorbar')
                .data([d3.range(cbar.numBars())]);

            cEnter = cbars.enter().append('g')
                .attr('class', 'colorbar')
                // .attr('transform', 'rotate(90)');
            ;

            bars = cEnter.append('g').attr('class', 'bars');
            
            bars.append('text')
                .attr('text-anchor', 'middle')
                .attr('class', 'cbar-title')
            ;
            
            bars = bars.selectAll('.bar')
                .data(function(d) {
                    return d;
                }).enter()
                .append('g')
                .attr('class', 'bar');
            
            bars.append('rect');
            
            bars.append('text')
                .attr("dy", cbar.horizontal()?'.6em':'.3em')
                .attr('text-anchor', 'middle')
                .attr('class', 'cb-text');

            // NOW UPDATE THE ELEMENTS' ATTRIBUTES
            var crot = cbar.horizontal()? 'rotate(90)':'',
                trot = cbar.horizontal()?'rotate(-90)':'rotate(-90)',
                rot = cbar.horizontal()?'rotate(-90)':'';
            
            cbar.svg.select('.colorbar')
                .attr("transform", "translate(" + cbar.x() + "," + cbar.y() + ")" + crot);
            
            cbar.svg.select('.cbar-title')
                .text(cbar.title())
                .attr('transform', "translate(" + (-7) + "," + (-cbar.barHeight() * cbar.numBars()/2) + ')' + trot)
            ;
            
            cbar.svg.selectAll('.bar')
                .attr('transform', function(d,i) {
                    return 'translate(0' + (-i*cbar.barHeight()) + ')';
                });
            
            cbar.svg.selectAll('.bar rect')
                .attr('width', cbar.width())
                .attr('height', cbar.barHeight())
                .attr('fill', function(d) {
                    return cbar.colorScale()(cbar.cbarscale(d));
                });

            var colorbarText = function(d, i) {
                var bounds = cbar.bounds();
                if(_.contains(cbar.labelIndices(), i)){
                    return parseInt(bounds[0] + (bounds[1]-bounds[0]) * (i*1.0/cbar.numBars()), 10); 
                    //return parseFloat(i*1.0/cbar.COLOR_BARS, 10).toFixed(1);
                }
            };
            
            cbar.svg.selectAll('.bar text').text(colorbarText)
                // .attr("x", cbar.width() + 5)
                .attr('transform', 'translate(' + (cbar.width()+10) + ')' + rot);

            
                // .attr("y", function(d, i) { return -i * cbar.barHeight();});
                
        };

        return cbar;
    };

    
    
        
       
}(window.kcharts = window.kcharts || {}));
