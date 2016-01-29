Template.registerHelper('mspIsDeviceConnected', function () {
    return Session.get('mspConnectedDeviceName');
});

Template.registerHelper('mspRc', function (stick) {
    if (Session.get('mspData')) {
        return Session.get('mspData').rc[stick];
    }

    return 1000;
});

Template.registerHelper('mspRcPercentage', function (stick) {
    if (Session.get('mspData')) {
        return (Session.get('mspData').rc[stick] - 1000) / 10;
    }

    return 0;
});

Template.registerHelper('mspRawImu', function (sensor, coord) {
    if (Session.get('mspData')) {
        return Session.get('mspData').rawImu[sensor][coord];
    }

    return 0;
});

Template.registerHelper('mspIsBoxActive', function (nameOrIndex) {
    var index;

    if (Session.get('mspBoxNames') && Session.get('mspData')) {
        index = isNaN(nameOrIndex) ? Session.get('mspBoxNames').indexOf(nameOrIndex.toUpperCase()) : nameOrIndex;
        if (index > -1) {
            return Session.get('mspData').status.boxActivation[index];
        }
    }

    return false;
});