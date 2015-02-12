var TcpServer = Meteor.npmRequire('multiwii-msp').TcpServer;

Meteor.startup(function () {
    var server, mspStream, methods;

    mspStream = new Meteor.Stream('msp');
    server = new TcpServer(3002, true);

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

    methods = {};

    methods.mspAvailableDeviceNames = function () {
    };

    Meteor.methods(methods);
});