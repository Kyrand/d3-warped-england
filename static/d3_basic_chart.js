/* global $, _  */
(function(kcharts) {
    
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
        var basicParams =  {
            height:100, width:100
        };

        this.params = typeof params !== 'undefined'? _.extend(basicParams, params): basicParams;
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


}(window.kcharts = window.kcharts || {}));
