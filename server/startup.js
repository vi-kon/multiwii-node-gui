var TcpServer = Meteor.npmRequire('multiwii-msp').TcpServer;

Meteor.startup(function () {
    var server, stream, methods;

    stream = new Meteor.Stream('msp');
    server = new TcpServer(3002, true);
    methods = {};

    server.on('register', function (key, device) {
        device.on('open', function () {
            stream.emit('open', key);
        });
        device.on('update', function (data) {
            stream.emit('update' + key, data);
        });
        device.on('close', function () {
            stream.emit('close', key);
        });

        stream.emit('register', key);
    });

    methods.mspListAvailableDeviceNames = function () {
        var keys, name, devices, ident;

        keys = [];
        devices = server.listDevices();
        for (name in devices) {
            if (devices.hasOwnProperty(name)) {
                ident = Meteor.sync(function (callback) {
                    devices[name].ident({}, callback);
                }).result;
                keys.push({
                              name: name, version: ident.version
                          });
            }
        }

        return keys;
    };

    methods.mspIsDeviceAvailable = function (deviceName) {
        return server.hasDevice(deviceName) && server.getDevice(deviceName).isConnected();
    };

    methods.mspDeviceBoxNames = function (deviceName) {
        if (methods.mspIsDeviceAvailable(deviceName)) {
            return Meteor.sync(function (callback) {
                server.getDevice(deviceName).boxNames({}, callback);
            }).result;
        }

        throw new Meteor.Error('Device is not connected');
    };

    methods.mspDeviceBox = function (deviceName) {
        if (methods.mspIsDeviceAvailable(deviceName)) {
            return Meteor.sync(function (callback) {
                server.getDevice(deviceName).box({}, callback);
            }).result;
        }

        throw new Meteor.Error('Device is not connected');
    };

    methods.mspSetDeviceBox = function (deviceName, box) {
        if (methods.mspIsDeviceAvailable(deviceName)) {
            return Meteor.sync(function (callback) {
                server.getDevice(deviceName).setBox(box, {}, callback);
            }).result;
        }

        throw new Meteor.Error('Device is not connected');
    };

    methods.mspSetDeviceRawRc = function (deviceName, rc) {
        if (methods.mspIsDeviceAvailable(deviceName)) {
            return Meteor.sync(function (callback) {
                server.getDevice(deviceName).setRawRc(rc, {}, callback);
            }).result;
        }

        throw new Meteor.Error('Device is not connected');
    };

    Meteor.methods(methods);
})
;