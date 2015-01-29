MultiWiiSerialProtocol = (function () {
    "use strict";

    var Future = Npm.require('fibers/future');
    var Fiber = Npm.require('fibers');
    var util = Npm.require('util');
    var EventEmitter = Npm.require('events').EventEmitter;

    /**
     *
     * Protocol format
     * 0           - $
     * 1           - M
     * 2           - <!>
     * 3           - payload length
     * 4           - no
     * 5           - code
     * 6-length    - payload
     * 7+length+1  - crc
     *
     * @constructor
     */
    function TcpProtocol() {
        this._data = [];
    }

    /**
     *
     * @param {Buffer} data - payload
     * @returns {*}
     */
    TcpProtocol.prototype.unserialize = function (data) {
        var i, length, id, code, crc, offset, valid, error;

        for (i = 0; i < data.length; i = i + 1) {
            this._data[this._data.length] = data.readUInt8(i);
        }

        valid = false;
        offset = 0;
        while (offset < this._data.length) {
            if (this._data[offset] !== 36) {
                offset = offset + 1;
                error = 'No beginning "$" char';
            } else if (this._data[offset + 1] !== 77) {
                offset = offset + 2;
                error = 'No beginning "M" char';
            } else if (this._data[offset + 2] !== 62) {
                offset = offset + 3;
                error = 'No beginning ">" char';
            } else if (this._data[offset + 3] <= this._data.length - 6 - offset) {
                length = this._data[offset + 3];
                id = this._data[offset + 4];
                code = this._data[offset + 5];
                crc = 0x00 ^ length ^ code;

                for (i = 0; i < length; i = i + 1) {
                    crc ^= this._data[offset + 6 + i];
                }

                if (crc !== this._data[offset + 6 + length]) {
                    offset = offset + 6 + length;
                    error = 'CRC error';
                    break;
                }

                data = new Buffer(length);
                for (i = 0; i < length; i = i + 1) {
                    data.writeUInt8(this._data[offset + 6 + i], i);
                }

                valid = true;
                offset = offset + 6 + length + 1;
            } else {
                error = 'Data length is less then payload length';
                break;
            }
        }

        this._data = this._data.slice(offset);

        if (valid) {
            return {
                valid : true,
                length: length,
                id    : id,
                code  : code,
                data  : data
            };
        }

        return {
            valid: false,
            error: error
        };
    };

    /**
     *
     * @param {int}         id     - package identifier
     * @param {int}         code   - command code
     * @param {Buffer|null} [data] - payload
     * @returns {Buffer}
     */
    TcpProtocol.prototype.serialize = function (id, code, data) {
        var i, length, crc, buffer;

        length = data === undefined || data === null ? 0 : data.length;

        buffer = new Buffer(7 + length);
        buffer.write('$M<');
        buffer.writeUInt8(length, 3);
        buffer.writeUInt8(id, 4);
        buffer.writeUInt8(code, 5);

        crc = 0x00 ^ length ^ code;
        for (i = 0; i < length; i = i + 1) {
            crc ^= data.readUInt8(i);
            buffer.writeUInt8(data.readUInt8(i), i + 6);
        }
        buffer.writeUInt8(crc, buffer.length - 1);

        return buffer;
    };


    /**
     *
     * @param {Socket} socket
     * @constructor
     */
    function PackageManager(socket) {
        var self, data;

        self = this;
        data = [];

        this._lastId = 0;
        this._tcpProtocol = new TcpProtocol();
        this._socket = socket;
        this._queue = {};

        this._socket.on('data', function (data) {
            var result;

            result = self._tcpProtocol.unserialize(data);

            if (result.valid) {
                clearTimeout(self._queue[result.id].timeout);
                self._queue[result.id].callback(null, result.data);
                delete self._queue[result.id];
            }
        });
    }

    PackageManager.prototype.getNextId = function () {
        var i = this._lastId;

        do {
            if (i === 255) {
                i = 0;
            } else {
                i++;
            }
            if (!this._queue.hasOwnProperty(i)) {
                this.lastId = i;
                break;
            }
        } while (i !== this._lastId);

        return this.lastId;
    };

    /**
     *
     * Register package in processing queue
     *
     * @param {int} code         - code NO
     * @param {Buffer|null} data - data buffer or null if no data
     * @param callback           - callback function for response
     * @param {int} [wait=5000]  - timeout for response
     */
    PackageManager.prototype.send = function (code, data, callback, wait) {
        var id = this.getNextId();
        this._queue[id] = {
            callback: callback,
            timeout : setTimeout(function () {
                callback('Timeout reach');
            }, wait === undefined ? 5000 : wait)
        };
        this._socket.write(this._tcpProtocol.serialize(id, code, data));
    };

    function Protocol(packageManager) {
        this._packageManager = packageManager;

        this.send = function (code, data, dataCallback, callback) {
            if (callback === undefined || callback === null) {
                var future = new Future();

                this._packageManager.send(code, data, function (error, data) {
                    if (error) {
                        //console.log('PM: Error');
                        future.throw(error);
                    } else {
                        //console.log('PM: Return');
                        future.return(!dataCallback ? null : dataCallback(data));
                    }
                });

                return future.wait();
            }
            this._packageManager.send(code, data, function (error, data) {
                callback(error, error || !dataCallback ? null : dataCallback(data));
            });
        };
    }

    Protocol.prototype.ident = function (callback) {
        return this.send(100, null, function (data) {
            return {
                version   : data.readUInt8(0),
                multiType : data.readUInt8(1),
                mspVersion: data.readUInt8(2),
                capability: data.readUInt32LE(3)
            };
        }, callback);
    };

    Protocol.prototype.status = function (callback) {
        return this.send(101, null, function (data) {
            return {
                cycleTime           : data.readUInt16LE(0),
                i2cErrorCount       : data.readUInt16LE(2),
                sensorPresent       : data.readUInt16LE(4),
                boxActivation       : data.readUInt32LE(6),
                currentSettingNumber: data.readUInt8(10)
            };
        }, callback);
    };

    Protocol.prototype.rawImu = function (callback) {
        return this.send(102, null, function (data) {
            return {
                gyro: {
                    x: data.readInt16LE(0),
                    y: data.readInt16LE(2),
                    z: data.readInt16LE(4)
                },
                acc : {
                    x: data.readInt16LE(6),
                    y: data.readInt16LE(8),
                    z: data.readInt16LE(10)
                },
                mag : {
                    x: data.readInt16LE(12),
                    y: data.readInt16LE(14),
                    z: data.readInt16LE(16)
                }
            };
        }, callback);
    };

    Protocol.prototype.servo = function (callback) {
        return this.send(103, null, function (data) {
            return [
                data.readUInt16LE(0),
                data.readUInt16LE(2),
                data.readUInt16LE(4),
                data.readUInt16LE(6),
                data.readUInt16LE(8),
                data.readUInt16LE(10),
                data.readUInt16LE(12),
                data.readUInt16LE(14)
            ];
        }, callback);
    };

    Protocol.prototype.motor = function (callback) {
        return this.send(104, null, function (data) {
            return [
                data.readUInt16LE(0),
                data.readUInt16LE(2),
                data.readUInt16LE(4),
                data.readUInt16LE(6),
                data.readUInt16LE(8),
                data.readUInt16LE(10),
                data.readUInt16LE(12),
                data.readUInt16LE(14)
            ];
        }, callback);
    };

    Protocol.prototype.rc = function (callback) {
        return this.send(105, null, function (data) {
            return {
                roll    : data.readUInt16LE(0),
                pitch   : data.readUInt16LE(2),
                yaw     : data.readUInt16LE(4),
                throttle: data.readUInt16LE(6),
                aux1    : data.readUInt16LE(8),
                aux2    : data.readUInt16LE(10),
                aux3    : data.readUInt16LE(12),
                aux4    : data.readUInt16LE(14)
            };
        }, callback);
    };

    Protocol.prototype.rawGPS = function (callback) {
        return this.send(106, null, function (data) {
            return {
                fix         : data.readUInt8(0),
                numSat      : data.readUInt8(1),
                coord       : {
                    latitude : data.readUInt32LE(2),
                    longitude: data.readUInt32LE(6),
                    altitude : data.readUInt16LE(10)
                },
                speed       : data.readUInt16LE(12),
                groundCourse: data.readUInt16LE(14)
            };
        }, callback);
    };

    Protocol.prototype.compGPS = function (callback) {
        return this.send(107, null, function (data) {
            return {
                distanceToHome : data.readUInt16LE(0),
                directionToHome: data.readUInt16LE(2),
                update         : data.readUInt8(4)
            };
        }, callback);
    };

    Protocol.prototype.attitude = function (callback) {
        return this.send(108, null, function (data) {
            return {
                x      : data.readInt16LE(0),
                y      : data.readInt16LE(2),
                heading: data.readInt16LE(4)
            };
        }, callback);
    };

    Protocol.prototype.altitude = function (callback) {
        return this.send(109, null, function (data) {
            return {
                estimated: data.readInt32LE(0),
                vario    : data.readInt16LE(4)
            };
        }, callback);
    };

    Protocol.prototype.analog = function (callback) {
        return this.send(110, null, function (data) {
            return {
                vbat            : data.readUInt8(0),
                intPowerMeterSum: data.readUInt16LE(1),
                rssi            : data.readUInt16LE(3),
                amperage        : data.readUInt16LE(5)
            };
        }, callback);
    };
    Protocol.prototype.rcTuning = function (callback) {
        return this.send(111, null, function (data) {
            return {
                rcRate        : data.readUInt8(0),
                rcExpo        : data.readUInt8(1),
                rollPitchRate : data.readUInt8(2),
                yawRate       : data.readUInt8(3),
                dynThrottlePID: data.readUInt8(4),
                throttleMID   : data.readUInt8(5),
                throttleExpo  : data.readUInt8(6)
            };
        }, callback);
    };

    Protocol.prototype.pid = function (callback) {
        return this.send(112, null, function (data) {
            return {
                roll    : {
                    p: data.readUInt8(0),
                    i: data.readUInt8(1),
                    d: data.readUInt8(2)
                },
                pitch   : {
                    p: data.readUInt8(3),
                    i: data.readUInt8(4),
                    d: data.readUInt8(5)
                },
                yaw     : {
                    p: data.readUInt8(6),
                    i: data.readUInt8(7),
                    d: data.readUInt8(8)
                },
                altitude: {
                    p: data.readUInt8(9),
                    i: data.readUInt8(10),
                    d: data.readUInt8(11)
                },
                pos     : {
                    p: data.readUInt8(12),
                    i: data.readUInt8(13),
                    d: data.readUInt8(14)
                },
                posr    : {
                    p: data.readUInt8(15),
                    i: data.readUInt8(16),
                    d: data.readUInt8(17)
                },
                navr    : {
                    p: data.readUInt8(18),
                    i: data.readUInt8(19),
                    d: data.readUInt8(20)
                },
                level   : {
                    p: data.readUInt8(21),
                    i: data.readUInt8(22),
                    d: data.readUInt8(23)
                },
                mag     : {
                    p: data.readUInt8(24),
                    i: data.readUInt8(25),
                    d: data.readUInt8(26)
                },
                vel     : {
                    p: data.readUInt8(27),
                    i: data.readUInt8(28),
                    d: data.readUInt8(29)
                }
            };
        }, callback);
    };

    Protocol.prototype.box = function (callback) {
        return this.send(113, null, function (data) {
            var i, box;

            box = [];
            for (i = 0; i < data.length; i = i + 2) {
                box[box.length] = data.readUInt16LE(i);
            }
            return box;
        }, callback);
    };

    Protocol.prototype.misc = function (callback) {
        return this.send(114, null, function (data) {
            return {
                intPowerTrigger: data.readUInt16LE(0),
                conf           : {
                    minThrottle     : data.readUInt16LE(2),
                    maxThrottle     : data.readUInt16LE(4),
                    minCommand      : data.readUInt16LE(6),
                    failSafeThrottle: data.readUInt16LE(8),
                    magDeclination  : data.readUInt16LE(16),
                    vbat            : {
                        scale: data.readUInt8(18),
                        level: {
                            warn1: data.readUInt8(19),
                            warn2: data.readUInt8(20),
                            crit : data.readUInt8(21)
                        }
                    }
                },
                plog           : {
                    arm     : data.readUInt16LE(10),
                    lifetime: data.readUInt32LE(12)
                }
            };
        }, callback);
    };

    Protocol.prototype.motorPins = function (callback) {
        return this.send(115, null, function (data) {
            return [
                data.readUInt8(0),
                data.readUInt8(1),
                data.readUInt8(2),
                data.readUInt8(3),
                data.readUInt8(4),
                data.readUInt8(5),
                data.readUInt8(6),
                data.readUInt8(7)
            ];
        }, callback);
    };

    Protocol.prototype.boxNames = function (callback) {
        return this.send(116, null, function (data) {
            return data.toString().split(';').filter(function (value) {
                return value !== '';
            });
        }, callback);
    };

    Protocol.prototype.pidNames = function (callback) {
        return this.send(117, null, function (error, data) {
            return data.toString().split(';').filter(function (value) {
                return value !== '';
            });
        }, callback);
    };

    Protocol.prototype.wp = function (callback) {
        return this.send(118, null, function (data) {
            return {
                wpNo      : data.readUInt8(0),
                latitude  : data.readUInt32LE(1),
                longitude : data.readUInt32LE(5),
                altHold   : data.readUInt32LE(9),
                heading   : data.readUInt16LE(11),
                timeToStay: data.readUInt16LE(13),
                navFlag   : data.readUInt8(15)
            };
        }, callback);
    };

    Protocol.prototype.boxIDs = function (callback) {
        return this.send(119, null, function (data) {
            var i, boxIDs;

            boxIDs = [];
            for (i = 0; i < data.length; i = i + 1) {
                boxIDs[boxIDs.length] = data.readInt8(i);
            }

            return boxIDs;
        }, callback);
    };

    Protocol.prototype.servoConf = function (callback) {
        return this.send(120, null, function (data) {
            var i, servoConf;

            servoConf = [];
            for (i = 0; i < 8; i = i + 1) {
                servoConf[servoConf.length] = {
                    min   : data.readUInt16LE(i * 7),
                    max   : data.readUInt16LE(i * 7 + 2),
                    middle: data.readUInt16LE(i * 7 + 4),
                    rate  : data.readUInt8(i * 7 + 6)
                };
            }

            return servoConf;
        }, callback);
    };

    Protocol.prototype.setRawRC = function (options, callback) {
        var data = new Buffer(16);

        data.writeUInt16LE(options.roll, 0);
        data.writeUInt16LE(options.pitch, 2);
        data.writeUInt16LE(options.yaw, 4);
        data.writeUInt16LE(options.throttle, 6);
        data.writeUInt16LE(options.aux1, 8);
        data.writeUInt16LE(options.aux2, 10);
        data.writeUInt16LE(options.aux3, 12);
        data.writeUInt16LE(options.aux4, 14);

        this.send(200, data, null, callback);
    };

    Protocol.prototype.setRawGPS = function (options, callback) {
        var data = new Buffer(14);

        data.writeUInt8(options.fix, 0);
        data.writeUInt8(options.numSat, 1);
        data.writeUInt32LE(options.latitude, 2);
        data.writeUInt32LE(options.longitude, 6);
        data.writeUInt16LE(options.altitude, 10);
        data.writeUInt16LE(options.speed, 12);

        this.send(201, data, null, callback);
    };

    Protocol.prototype.setPID = function (options, callback) {
        var data = new Buffer(30);

        data.writeUInt8(options.roll.p, 0);
        data.writeUInt8(options.roll.i, 1);
        data.writeUInt8(options.roll.d, 2);

        data.writeUInt8(options.pitch.p, 3);
        data.writeUInt8(options.pitch.i, 4);
        data.writeUInt8(options.pitch.d, 5);

        data.writeUInt8(options.yaw.p, 6);
        data.writeUInt8(options.yaw.i, 7);
        data.writeUInt8(options.yaw.d, 8);

        data.writeUInt8(options.alt.p, 9);
        data.writeUInt8(options.alt.i, 10);
        data.writeUInt8(options.alt.d, 11);

        data.writeUInt8(options.pos.p, 12);
        data.writeUInt8(options.pos.i, 13);
        data.writeUInt8(options.pos.d, 14);

        data.writeUInt8(options.posr.p, 15);
        data.writeUInt8(options.posr.i, 16);
        data.writeUInt8(options.posr.d, 17);

        data.writeUInt8(options.navr.p, 18);
        data.writeUInt8(options.navr.i, 19);
        data.writeUInt8(options.navr.d, 20);

        data.writeUInt8(options.level.p, 21);
        data.writeUInt8(options.level.i, 22);
        data.writeUInt8(options.level.d, 23);

        data.writeUInt8(options.mag.p, 24);
        data.writeUInt8(options.mag.i, 25);
        data.writeUInt8(options.mag.d, 26);

        data.writeUInt8(options.vel.p, 27);
        data.writeUInt8(options.vel.i, 28);
        data.writeUInt8(options.vel.d, 29);

        this.send(202, data, null, callback);
    };

    Protocol.prototype.setBox = function (box, callback) {
        var i, data;

        data = new Buffer(box.length * 2);

        for (i = 0; i < box.length; i = i + 1) {
            data.writeUInt16LE(box[i]);
        }

        this.send(203, data, null, callback);
    };

    Protocol.prototype.setRCTuning = function (options, callback) {
        var data = new Buffer(7);

        data.writeUInt8(options.rcRate, 0);
        data.writeUInt8(options.rcExpo, 1);
        data.writeUInt8(options.rollPitchRate, 2);
        data.writeUInt8(options.yawRate, 3);
        data.writeUInt8(options.dynThrottlePID, 4);
        data.writeUInt8(options.throttleMID, 5);
        data.writeUInt8(options.throttleExpo, 6);

        this.send(204, data, null, callback);
    };

    Protocol.prototype.accCalibration = function (callback) {
        this.send(205, null, null, callback);
    };

    Protocol.prototype.magCalibration = function (callback) {
        this.send(206, null, null, callback);
    };

    Protocol.prototype.setMisc = function (options, callback) {
        var data = new Buffer(22);

        data.writeUInt16LE(options.intPowerTrigger, 0);
        data.writeUInt16LE(options.minThrottle, 2);
        data.writeUInt16LE(options.maxThrottle, 4);
        data.writeUInt16LE(options.minCommand, 6);
        data.writeUInt16LE(options.failSafeThrottle, 8);
        data.writeUInt16LE(options.arm, 10);
        data.writeUInt32LE(options.lifetime, 12);
        data.writeUInt16LE(options.magDeclination, 16);
        data.writeUInt8(options.vbat.scale, 18);
        data.writeUInt8(options.vbat.level.warn1, 19);
        data.writeUInt8(options.vbat.level.warn2, 20);
        data.writeUInt8(options.vbat.level.crit, 21);

        this.send(207, data, null, callback);
    };

    Protocol.prototype.resetConf = function (callback) {
        this.send(208, null, null, callback);
    };

    Protocol.prototype.setWp = function (options, callback) {
        var data = new Buffer(18);

        data.writeUInt8(options.wpNo, 0);
        data.writeUInt32LE(options.latitude, 1);
        data.writeUInt32LE(options.longitude, 5);
        data.writeUInt32LE(options.altHold, 9);
        data.writeUInt16LE(options.heading, 13);
        data.writeUInt16LE(options.timeToStay, 15);
        data.writeUInt8(options.navFlag, 17);

        this.send(209, data, null, callback);
    };

    Protocol.prototype.selectSetting = function (currentSet, callback) {
        var data = new Buffer(1);

        data.writeUInt8(currentSet, 0);

        this.send(210, data, null, callback);
    };

    Protocol.prototype.setHead = function (head, callback) {
        var data = new Buffer(2);

        data.writeInt16LE(head, 0);

        this.send(211, data, null, callback);
    };

    Protocol.prototype.setServoConf = function (servo, callback) {
        var i, data;

        data = new Buffer(56);

        for (i = 0; i < 8; i = i + 1) {
            data.writeUInt16LE(servo[i].min, i * 7);
            data.writeUInt16LE(servo[i].max, i * 7 + 2);
            data.writeUInt16LE(servo[i].middle, i * 7 + 4);
            data.writeUInt8(servo[i].rate, i * 7 + 6);
        }

        this.send(212, data, null, callback);
    };

    function OpenedProtocol() {
        var self = this;

        this._updating = false;
        this._log = [];
        this._cycleFunction = function () {
            Fiber(function () {
                var start;

                start = new Date().getTime();

                self._lastData = {
                    time    : new Date().getTime(),
                    status  : self._protocol.status(),
                    rawImu  : self._protocol.rawImu(),
                    rc      : self._protocol.rc(),
                    rawGPS  : self._protocol.rawGPS(),
                    compGPS : self._protocol.compGPS(),
                    attitude: self._protocol.attitude(),
                    altitude: self._protocol.altitude(),
                    analog  : self._protocol.analog()
                };
                self._lastData.cycleTime = new Date().getTime() - start;
                self._log.push(self._lastData);

                self.emit('update', self._lastData);

                if (self._updating) {
                    self._cycleFunction();
                } else {
                    self._timeout = null;
                }
            }).run();
        };

        this._protocol = null;
        this._lastData = null;
        this._ident = null;
    }

    util.inherits(OpenedProtocol, EventEmitter);

    OpenedProtocol.prototype.protocol = function () {
        return this._protocol;
    };

    OpenedProtocol.prototype.log = function () {
        return this._log;
    };

    OpenedProtocol.prototype.isConnected = function () {
        return this._protocol !== null;
    };

    OpenedProtocol.prototype.connect = function (protocol) {
        //console.log('Connect');
        this._protocol = protocol;
        this._ident = this._protocol.ident();
        this._updating = true;
        this._cycleFunction();
    };

    OpenedProtocol.prototype.disconnect = function () {
        this._protocol = null;
        this._updating = false;
        if (this._cycleFunction !== null) {
            clearTimeout(this._cycleFunction);
        }
    };

    OpenedProtocol.prototype.ident = function () {
        return this._ident;
    };
    OpenedProtocol.prototype.status = function () {
        return this._lastData.status;
    };
    OpenedProtocol.prototype.rawImu = function () {
        return this._lastData.rawImu;
    };
    OpenedProtocol.prototype.servo = function () {
        return this._lastData.servo;
    };
    OpenedProtocol.prototype.motor = function () {
        return this._lastData.motor;
    };
    OpenedProtocol.prototype.rc = function () {
        return this._lastData.rc;
    };
    OpenedProtocol.prototype.rawGPS = function () {
        return this._lastData.rawGPS;
    };
    OpenedProtocol.prototype.compGPS = function () {
        return this._lastData.compGPS;
    };
    OpenedProtocol.prototype.attitude = function () {
        return this._lastData.attitude;
    };
    OpenedProtocol.prototype.altitude = function () {
        return this._lastData.altitude;
    };
    OpenedProtocol.prototype.analog = function () {
        return this._lastData.analog;
    };

    OpenedProtocol.prototype.rcTuning = function () {
        return this._protocol.rcTuning();
    };
    OpenedProtocol.prototype.pid = function () {
        return this._protocol.pid();
    };
    OpenedProtocol.prototype.box = function () {
        return this._protocol.box();
    };
    OpenedProtocol.prototype.misc = function () {
        return this._protocol.misc();
    };
    OpenedProtocol.prototype.motorPins = function () {
        return this._protocol.motorPins();
    };
    OpenedProtocol.prototype.boxNames = function () {
        return this._protocol.boxNames();
    };
    OpenedProtocol.prototype.pidNames = function () {
        return this._protocol.pidNames();
    };
    OpenedProtocol.prototype.wp = function () {
        return this._protocol.wp();
    };
    OpenedProtocol.prototype.boxIDs = function () {
        return this._protocol.boxIDs();
    };
    OpenedProtocol.prototype.servoConf = function () {
        return this._protocol.servoConf();
    };
    OpenedProtocol.prototype.setRawRC = function (options) {
        return this._protocol.setRawRC(options);
    };
    OpenedProtocol.prototype.setRawGPS = function (options) {
        return this._protocol.setRawGPS(options);
    };
    OpenedProtocol.prototype.setPID = function (options) {
        return this._protocol.setPID(options);
    };
    OpenedProtocol.prototype.setBox = function (box) {
        return this._protocol.setBox(box);
    };
    OpenedProtocol.prototype.setRCTuning = function (options) {
        return this._protocol.setRCTuning(options);
    };
    OpenedProtocol.prototype.accCalibration = function () {
        return this._protocol.accCalibration();
    };
    OpenedProtocol.prototype.magCalibration = function () {
        return this._protocol.magCalibration();
    };
    OpenedProtocol.prototype.setMisc = function (options) {
        return this._protocol.setMisc(options);
    };
    OpenedProtocol.prototype.resetConf = function (options) {
        return this._protocol.resetConf(options);
    };
    OpenedProtocol.prototype.setWp = function (options) {
        return this._protocol.setWp(options);
    };
    OpenedProtocol.prototype.selectSetting = function (currentSet) {
        return this._protocol.selectSetting(currentSet);
    };
    OpenedProtocol.prototype.setHead = function (head) {
        return this._protocol.setHead(head);
    };
    OpenedProtocol.prototype.setServoConf = function (servo) {
        return this._protocol.setServoConf(servo);
    };

    return {
        PackageManager: PackageManager,
        Protocol      : Protocol,
        OpenedProtocol: OpenedProtocol
    };
}());