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

Template.registerHelper('mspBoxActive', function (boxIndex) {
    if (Session.get('mspData')) {
        return Session.get('mspData').status.boxActivation[boxIndex];
    }

    return false;
});