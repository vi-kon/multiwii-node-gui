LiveChartLine = function (options) {
    var i, j, ctx, chartOptions, chartDataOptions;

    this._queueSize = options.hasOwnProperty('queueSize')
        ? options.queueSize
        : 50;

    chartOptions = {
        animation   : false,
        showTooltips: false,
        responsive  : true,
        //showScale   : false,
        pointDot    : false
    };

    chartDataOptions = {
        labels  : [],
        datasets: options.datasets
    };

    for (i = 0; i < this._queueSize; i++) {
        chartDataOptions.labels[i] = "";
        for (j = 0; j < chartDataOptions.datasets.length; j++) {
            chartDataOptions.datasets[j].data[i] = 0;
        }
    }

    // Get element by ID
    ctx = document.getElementById(options.id).getContext("2d");

    this._chart = new Chart(ctx).Line(chartDataOptions, chartOptions);
};

LiveChartLine.prototype.push = function (time, data) {
    var i, j;

    for (i = 0; i < this._chart.datasets.length; i++) {
        for (j = 0; j < this._queueSize - 1; j++) {
            this._chart.datasets[i].points[j].value = this._chart.datasets[i].points[j + 1].value;
        }
        this._chart.datasets[i].points[this._queueSize - 1].value = data[i];
    }
    this._chart.update();
};