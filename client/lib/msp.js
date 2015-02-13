/** @type {exports.Stream} */
var stream = new Meteor.Stream('msp');

/** @type {null|string} */
var connectedDeviceName = null;

stream.on('open', function (name) {
    if (Session.get('mspLastConnectedDeviceName') === name) {
        Session.set('mspConnectedDeviceName', name);
        Session.set('mspLastConnectedDeviceName', null);
        notify('Device ' + name + ' reconnected', 'success');
    }
});

stream.on('close', function (name) {
    if (connectedDeviceName === name) {
        Session.set('mspLastConnectedDeviceName', connectedDeviceName);
        Session.set('mspConnectedDeviceName', null);
        notify('Connection lost', 'error');
    }
});

Tracker.autorun(function () {
    if (Session.get('mspConnectedDeviceName')) {
        connectedDeviceName = Session.get('mspConnectedDeviceName');
        stream.on('update' + connectedDeviceName, function (data) {
            Session.set('mspData', data);
        });
    } else if (connectedDeviceName !== null) {
        stream.removeAllListeners('update' + connectedDeviceName);
        connectedDeviceName = null;
    }
});