var stream, mspConnectedDeviceName;

mspConnectedDeviceName = null;
stream = new Meteor.Stream('msp');

/**
 * Device connected to server
 */
stream.on('open', function (deviceName) {
    if (MspSession.lastConnectedDeviceName === deviceName) {
        MspSession.connectedDeviceName = deviceName;
        notify('Device ' + deviceName + ' reconnected', 'success');
    }
});

/**
 * Device close/lost connection to server
 */
stream.on('close', function (deviceName) {
    if (MspSession.connectedDeviceName) {
        MspSession.connectedDeviceName = deviceName;
        notify('Connection lost', 'error');
    }
});

/**
 * Register and unregister update event for connected device
 */
Tracker.autorun(function () {
    if (MspSession.connectedDeviceName) {
        mspConnectedDeviceName = MspSession.connectedDeviceName;
        stream.on('update' + MspSession.connectedDeviceName, function (data) {
            MspSession.data = data;
        });
    } else if (mspConnectedDeviceName !== null) {
        stream.removeAllListeners('update' + mspConnectedDeviceName);
        mspConnectedDeviceName = null;
    }
});