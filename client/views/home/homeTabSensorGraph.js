Chart.defaults.global.responsive = true;

(function ($, undefined) {
    "use strict";

    var stream = new Meteor.Stream('msp');

    Template.homeTabSensorGraph.helpers({
                                            rawImu      : function (sensor, coord) {
                                                return Session.get('mspActualData').rawImu[sensor][coord];
                                            },
                                            rc          : function (stick) {
                                                return Session.get('mspActualData').rc[stick];
                                            },
                                            rcPercentage: function (stick) {
                                                return (Session.get('mspActualData').rc[stick] - 1000) / 10;
                                            }
                                        });

    Template.homeTabSensorGraph.rendered = function () {
        var createChartDataSet, chartTabInitialized, chartMixed, chartAcc, chartGyro, chartMag,
            activeProtocol, updateProtocol;

        createChartDataSet = function (strokeColor, label, data) {
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
        };

        updateProtocol = function (data) {
            Session.set('mspActualData', data);

            if (chartTabInitialized) {
                chartMixed.push(data.time, [
                    data.rawImu.acc.x, data.rawImu.acc.y, data.rawImu.acc.z,
                    data.rawImu.gyro.x, data.rawImu.gyro.y, data.rawImu.gyro.z,
                    data.rawImu.mag.x, data.rawImu.mag.y, data.rawImu.mag.z
                ]);

                chartAcc.push(data.time, [
                    data.rawImu.acc.x, data.rawImu.acc.y, data.rawImu.acc.z
                ]);

                chartGyro.push(data.time, [
                    data.rawImu.gyro.x, data.rawImu.gyro.y, data.rawImu.gyro.z
                ]);

                chartMag.push(data.time, [
                    data.rawImu.mag.x, data.rawImu.mag.y, data.rawImu.mag.z
                ]);
            }
        };

        activeProtocol = null;
        chartTabInitialized = false;

        Tracker.autorun(function () {
            if (Session.get('mspConnectedDevice')) {
                stream.on('update' + Session.get('mspConnectedDevice'), updateProtocol);
                activeProtocol = Session.get('mspConnectedDevice');
            } else if (activeProtocol !== null) {
                stream.removeAllListeners('update' + activeProtocol);
                activeProtocol = null;
            }
        });

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            if ($(e.target).attr('href') === '#tab-sensor-graph') {
                if (!chartTabInitialized) {
                    chartMixed = new LiveChartLine({
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
                                                   });
                    chartAcc = new LiveChartLine({
                                                     id      : 'tab-sensor-graph-acc',
                                                     datasets: [
                                                         createChartDataSet('#1f77b4', "Acc Roll", []),
                                                         createChartDataSet('#ff7f0e', "Acc Pitch", []),
                                                         createChartDataSet('#2ca02c', "Acc Z", [])
                                                     ]
                                                 });
                    chartGyro = new LiveChartLine({
                                                      id      : 'tab-sensor-graph-gyro',
                                                      datasets: [
                                                          createChartDataSet('#d62728', "Gyro Roll", []),
                                                          createChartDataSet('#9467bd', "Gyro Pitch", []),
                                                          createChartDataSet('#8c564b', "Gyro Yaw", [])
                                                      ]
                                                  });
                    chartMag = new LiveChartLine({
                                                     id      : 'tab-sensor-graph-mag',
                                                     datasets: [
                                                         createChartDataSet('#e377c2', "Mag Roll", []),
                                                         createChartDataSet('#7f7f7f', "Mag Pitch", []),
                                                         createChartDataSet('#bcbd22', "Mag Yaw", [])
                                                     ]
                                                 });

                    chartTabInitialized = true;
                }
            }
        });
    };
}(jQuery));
