var homeEvents, homeTabSensorGraphHelpers, tabActive, tabInitialized, chartMixed, chartAcc, chartGyro, chartMag;

Chart.defaults.global.responsive = true;

function createChartDataSet(strokeColor, label, data) {
    var defaultChartOptions = {
        fillColor           : "rgba(0,0,0,0)",
        pointColor          : "rgba(220,220,220,1)",
        pointStrokeColor    : "#fff",
        pointHighlightFill  : "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)"
    };

    return $.extend({}, defaultChartOptions, {
        strokeColor: strokeColor,
        label      : label,
        data       : data
    });
}

homeEvents = {};

homeEvents['shown.bs.tab a[data-toggle="tab"]'] = function (e) {
    var options;

    if ($(e.target).attr('href') !== '#tab-sensor-graph') {
        tabActive = false;
    } else {
        tabActive = true;
        
        if (!tabInitialized) {
            options = {
                id      : 'tab-sensor-graph-mixed',
                datasets: [
                    createChartDataSet('#1f77b4', "Acc Roll", []),
                    createChartDataSet('#ff7f0e', "Acc Pitch", []),
                    createChartDataSet('#2ca02c', "Acc Z", []),

                    createChartDataSet('#d62728', "Gyro Roll", []),
                    createChartDataSet('#9467bd', "Gyro Pitch", []),
                    createChartDataSet('#8c564b', "Gyro Yaw", []),

                    createChartDataSet('#e377c2', "Mag Roll", []),
                    createChartDataSet('#7f7f7f', "Mag Pitch", []),
                    createChartDataSet('#bcbd22', "Mag Yaw", [])
                ]
            };
            chartMixed = new LiveChartLine(options);

            options = {
                id      : 'tab-sensor-graph-acc',
                datasets: [
                    createChartDataSet('#1f77b4', "Acc Roll", []),
                    createChartDataSet('#ff7f0e', "Acc Pitch", []),
                    createChartDataSet('#2ca02c', "Acc Z", [])
                ]
            };
            chartAcc = new LiveChartLine(options);

            options = {
                id      : 'tab-sensor-graph-gyro',
                datasets: [
                    createChartDataSet('#d62728', "Gyro Roll", []),
                    createChartDataSet('#9467bd', "Gyro Pitch", []),
                    createChartDataSet('#8c564b', "Gyro Yaw", [])
                ]
            };
            chartGyro = new LiveChartLine(options);

            options = {
                id      : 'tab-sensor-graph-mag',
                datasets: [
                    createChartDataSet('#e377c2', "Mag Roll", []),
                    createChartDataSet('#7f7f7f', "Mag Pitch", []),
                    createChartDataSet('#bcbd22', "Mag Yaw", [])
                ]
            };
            chartMag = new LiveChartLine(options);

            tabInitialized = true;
        }
    }
};

homeTabSensorGraphHelpers = {};

homeTabSensorGraphHelpers.rawImu = function (sensor, coord) {
    return Session.get('mspData').rawImu[sensor][coord];
};

homeTabSensorGraphHelpers.rc = function (stick) {
    return Session.get('mspData').rc[stick];
};

homeTabSensorGraphHelpers.rcPercentage = function (stick) {
    return (Session.get('mspData').rc[stick] - 1000) / 10;
};

tabInitialized = false;

Template.home.events(homeEvents);
Template.homeTabSensorGraph.helpers(homeTabSensorGraphHelpers);

Tracker.autorun(function () {
    var time, rawImu;

    time = Session.get('mspData').time;
    rawImu = Session.get('mspData').rawImu;

    if (tabActive) {
        chartMixed.push(time, [
            rawImu.acc.x, rawImu.acc.y, rawImu.acc.z,
            rawImu.gyro.x, rawImu.gyro.y, rawImu.gyro.z,
            rawImu.mag.x, rawImu.mag.y, rawImu.mag.z
        ]);

        chartAcc.push(time, [
            rawImu.acc.x, rawImu.acc.y, rawImu.acc.z
        ]);

        chartGyro.push(time, [
            rawImu.gyro.x, rawImu.gyro.y, rawImu.gyro.z
        ]);

        chartMag.push(time, [
            rawImu.mag.x, rawImu.mag.y, rawImu.mag.z
        ]);
    }
});
