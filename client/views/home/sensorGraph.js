var homeTab, tabActive, tabInitialized, chartMixed, chartAcc, chartGyro, chartMag;

tabActive = false;
tabInitialized = false;

homeTab = {};

homeTab['shown.bs.tab a[data-toggle="tab"]'] = function (e) {
    if ($(e.target).attr('href') !== '#tab-sensor-graph') {
        tabActive = false;
    } else {
        tabActive = true;

        if (!tabInitialized) {
            chartMixed = new LiveChart('tab-sensor-graph-mixed', [
                {strokeColor: '#1f77b4', label: "Acc Roll"},
                {strokeColor: '#ff7f0e', label: "Acc Pitch"},
                {strokeColor: '#2ca02c', label: "Acc Z"},

                {strokeColor: '#d62728', label: "Gyro Roll"},
                {strokeColor: '#9467bd', label: "Gyro Pitch"},
                {strokeColor: '#8c564b', label: "Gyro Yaw"},

                {strokeColor: '#e377c2', label: "Mag Roll"},
                {strokeColor: '#7f7f7f', label: "Mag Pitch"},
                {strokeColor: '#bcbd22', label: "Mag Yaw"}
            ]);

            chartAcc = new LiveChart('tab-sensor-graph-acc', [
                {strokeColor: '#1f77b4', label: "Acc Roll"},
                {strokeColor: '#ff7f0e', label: "Acc Pitch"},
                {strokeColor: '#2ca02c', label: "Acc Z"}
            ]);

            chartGyro = new LiveChart('tab-sensor-graph-gyro', [
                {strokeColor: '#d62728', label: "Gyro Roll"},
                {strokeColor: '#9467bd', label: "Gyro Pitch"},
                {strokeColor: '#8c564b', label: "Gyro Yaw"}
            ]);

            chartMag = new LiveChart('tab-sensor-graph-mag', [
                {strokeColor: '#e377c2', label: "Mag Roll"},
                {strokeColor: '#7f7f7f', label: "Mag Pitch"},
                {strokeColor: '#bcbd22', label: "Mag Yaw"}
            ]);

            tabInitialized = true;
        }
    }
};

Template.home.events(homeTab);

Tracker.autorun(function () {
    var rawImu;

    if (Session.get('mspData') && tabInitialized) {
        rawImu = Session.get('mspData').rawImu;
        chartMixed.push([
                            rawImu.acc.x, rawImu.acc.y, rawImu.acc.z,
                            rawImu.gyro.x, rawImu.gyro.y, rawImu.gyro.z,
                            rawImu.mag.x, rawImu.mag.y, rawImu.mag.z
                        ]);
        chartAcc.push([
                          rawImu.acc.x, rawImu.acc.y, rawImu.acc.z
                      ]);

        chartGyro.push([
                           rawImu.gyro.x, rawImu.gyro.y, rawImu.gyro.z
                       ]);

        chartMag.push([
                          rawImu.mag.x, rawImu.mag.y, rawImu.mag.z
                      ]);
    }
});