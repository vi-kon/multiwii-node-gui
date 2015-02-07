var TcpServer = Meteor.npmRequire('multiwii-msp').TcpServer;

Meteor.startup(function () {
    var server, mspStream, methods;

    mspStream = new Meteor.Stream('msp');
    server = new TcpServer(3002, true);
    methods = {};

    server.on('register', function (key, device) {
        device.on('open', function () {
            mspStream.emit('open', key);
        });
        device.on('update', function (data) {
            mspStream.emit('update' + key, data);
        });
        device.on('close', function () {
            mspStream.emit('close', key);
        });

        mspStream.emit('mspRegister', key);
    });

    methods.mspAvailableDeviceNames = function () {
        var keys, name, devices;

        keys = [];
        devices = server.listDevices();
        for (name in devices) {
            keys.push({name: name, version: devices[name].ident().version});
        }

        console.log(keys);

        return keys;
    };

    methods.mspIsConnected = function (name) {
        return server.hasDevice(name) && server.getDevice(name).isConnected();
    };

    methods.mspLog = function (name) {
        if (server.hasDevice(name)) {
            return server.getDevice(name).log();
        }
    };

    methods.mspIdent = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).ident();
        }
    };

    methods.mspStatus = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).status();
        }
    };

    methods.mspRawImu = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).rawImu();
        }
    };

    methods.mspServo = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).servo();
        }
    };

    methods.mspMotor = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).motor();
        }
    };

    methods.mspRc = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).rc();
        }
    };

    methods.mspRawGps = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).rawGps();
        }
    };

    methods.mspCompGps = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).compGps();
        }
    };

    methods.mspAttitude = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).attitude();
        }
    };

    methods.mspAltitude = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).altitude();
        }
    };

    methods.mspAnalog = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).analog();
        }
    };

    methods.mspRcTuning = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).rcTuning();
        }
    };

    methods.mspPid = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).pid();
        }
    };

    methods.msbBox = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).box();
        }
    };

    methods.mspMisc = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).misc();
        }
    };

    methods.mspMotorPins = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).motorPins();
        }
    };

    methods.mspBoxNames = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).boxNames();
        }
    };

    methods.mspPidNames = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).pidNames();
        }
    };

    methods.mspWp = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).wp();
        }
    };

    methods.mspBoxIds = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).boxIds();
        }
    };

    methods.mspServoConf = function (name) {
        if (methods.mspIsConnected(name)) {
            return server.getDevice(name).servoConf();
        }
    };

    Meteor.methods(methods);
});