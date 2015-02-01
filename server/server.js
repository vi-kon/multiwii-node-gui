mspOpenedProtocols = {};

(function () {
    var stream = new Meteor.Stream('msp');

    var Net = Npm.require('net');
    var Fiber = Npm.require('fibers');

    Meteor.startup(function () {
        var server;

        server = Net.createServer(function (socket) {
            Fiber(function () {
                var packageManager, address, key;

                console.log('SERV: Client connecting...');

                packageManager = new MultiWiiSerialProtocol.TcpPackageManager(socket);

                address = socket.address();
                key = address.address + ':' + address.port;

                if (!mspOpenedProtocols.hasOwnProperty(key)) {
                    mspOpenedProtocols[key] = new MultiWiiSerialProtocol.Protocol();

                    mspOpenedProtocols[key].on('update', function (lastData) {
                        stream.emit('update' + key, lastData);
                    });
                }

                mspOpenedProtocols[key].connect(packageManager);
                stream.emit('open', key);

                socket.on('close', function () {
                    mspOpenedProtocols[key].disconnect();
                    stream.emit('close', key);
                    console.log('SERV: Client disconnected');
                });

                console.log('SERV: Client connected');
            }).run();
        });

        server.on('error', function (error) {
            console.log('SERV: ' + error);
        });

        server.listen(3002, function () {
            console.log('SERV: Server listening...');
        });
    });
}());