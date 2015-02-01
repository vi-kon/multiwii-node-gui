MultiWiiSerialProtocol = function () {
    "use strict";

    var Future = Npm.require('fibers/future');
    var Fiber = Npm.require('fibers');
    var util = Npm.require('util');
    var EventEmitter = Npm.require('events').EventEmitter;

    function clone(obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (obj === null || "object" !== typeof obj) {
            return obj;
        }


        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = clone(obj[attr]);
                }
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

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
     * @param {int} type - protocol type (request, response)
     * @constructor
     */
    function TcpProtocol(type) {
        this._data = [];
        this._type = type;
    }

    TcpProtocol.type = {
        REQUEST : 1,
        RESPONSE: 2
    };

    /**
     *
     * @param {int}    id   - package identifier
     * @param {int}    code - package code
     * @param {Buffer} data - package payload
     * @returns {Buffer}
     */
    TcpProtocol.prototype.serialize = function (id, code, data) {
        var i, length, crc, buffer;

        length = data === undefined || data === null ? 0 : data.length;

        buffer = new Buffer(7 + length);
        buffer.writeUInt8(36, 0); // $
        buffer.writeUInt8(77, 1); // M
        if (this._type === TcpProtocol.type.REQUEST) {
            buffer.writeUInt8(60, 2); // <
        } else {
            buffer.writeUInt8(62, 2); // >
        }
        buffer.writeUInt8(length, 3);
        buffer.writeUInt8(id, 4);
        buffer.writeUInt8(code, 5);

        crc = 0x00 ^ id ^ code ^ length;
        for (i = 0; i < length; i = i + 1) {
            crc ^= data.readUInt8(i);
            buffer.writeUInt8(data.readUInt8(i), i + 6);
        }
        buffer.writeUInt8(crc, buffer.length - 1);

        return buffer;
    };

    /**
     *
     * @param {Buffer} data
     * @returns {{valid: boolean, error: string, id: int, code: int, length: int, data: Buffer}}
     */
    TcpProtocol.prototype.unserialize = function (data) {
        var i, length, id, code, crc, offset, valid, error, response;

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
            } else if (this._data[offset + 2] !== 62 && this._type === TcpProtocol.type.REQUEST) {
                offset = offset + 3;
                error = 'No beginning ">" char';
            } else if (this._data[offset + 2] !== 60 && this._type === TcpProtocol.type.RESPONSE) {
                offset = offset + 3;
                error = 'No beginning "<" char';
            } else if (this._data[offset + 3] <= this._data.length - 6 - offset) {
                id = this._data[offset + 4];
                code = this._data[offset + 5];
                length = this._data[offset + 3];
                crc = 0x00 ^ id ^ code ^ length;

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

        response = {
            valid: valid
        };
        if (valid) {
            response.id = id;
            response.code = code;
            response.length = length;
            response.data = data;
        } else {
            response.error = error;
        }

        return response;
    };

    /**
     *
     * @param {Socket} socket
     * @constructor
     */
    function TcpPackageManager(socket) {
        var self;

        self = this;
        self._lastId = 0;
        self._packages = {};
        self._socket = socket;
        self._tcpProtocol = new TcpProtocol(TcpProtocol.type.REQUEST);

        self._socket.on('data', function (data) {
            var result;

            result = self._tcpProtocol.unserialize(data);

            if (result.valid && self._packages.hasOwnProperty(result.id)) {
                clearTimeout(self._packages[result.id].timeout);
                self._packages[result.id].callback(null, result.data);
                delete self._packages[result.id];
            }
        });
    }

    /**
     * Get next package identifier
     *
     * @returns {number}
     */
    TcpPackageManager.prototype.getNextPackageId = function () {
        var i;

        i = this._lastId;
        do {
            i = i === 255 ? 0 : i + 1;
            if (!this._packages.hasOwnProperty(i)) {
                this.lastId = i;
                break;
            }
        } while (i !== this.lastId);

        this._lastId = i;

        return this._lastId;
    };

    /**
     * Send package via socket
     *
     * @param {int} code
     * @param {Buffer} data
     * @param onDataCallback
     * @param callback
     * @returns {*}
     */
    TcpPackageManager.prototype.send = function (code, data, onDataCallback, callback) {
        var self, id, future;

        self = this;
        id = self.getNextPackageId();
        future = new Future();
        self._packages[id] = {
            callback: function (error, data) {
                data = onDataCallback ? onDataCallback(data) : null;
                if (callback) {
                    callback(null, data);
                } else {
                    future.return(data);
                }
            },
            timeout : setTimeout(function () {
                var error;

                error = 'Package timeout reach (#' + id + '/' + code + ')';
                if (callback) {
                    callback(error);
                } else {
                    future.throw(error);
                }
                delete self._packages[id];
            }, 5000)
        };

        self._socket.write(this._tcpProtocol.serialize(id, code, data));

        if (!callback) {
            return future.wait();
        }
    };

    /**
     *
     * @constructor
     */
    function Protocol() {
        this._packageManager = null;
        this._log = [];


    }

    util.inherits(Protocol, EventEmitter);

    /**
     * Check if protocol is connected to device
     *
     * @returns {boolean}
     */
    Protocol.prototype.isConnected = function () {
        return this._packageManager !== null;
    };

    /**
     * Connect to device
     *
     * @param {TcpPackageManager} packageManager
     */
    Protocol.prototype.connect = function (packageManager) {
        var self, logger;

        self = this;
        self._packageManager = packageManager;
        self._cache = {};

        logger = function () {
            var startTime, data;

            startTime = new Date().getTime();

            data = {
                time    : new Date().getTime(),
                status  : self.status(),
                rawImu  : self.rawImu(),
                rc      : self.rc(),
                rawGPS  : self.rawGPS(),
                compGPS : self.compGPS(),
                attitude: self.attitude(),
                altitude: self.altitude(),
                analog  : self.analog()
            };
            data.cycleTime = new Date().getTime() - startTime;

            self._log.push(data);
            self.emit('update', data);

            if (self._packageManager !== null) {
                logger();
            }
        };

        self.ident();
        self.boxNames();
        self.pidNames();

        Fiber(logger).run();
    };

    /**
     * Disconnect from device
     */
    Protocol.prototype.disconnect = function () {
        this._packageManager = null;
    };

    /**
     *
     * Get ident
     *
     * Data format:
     * {
     *   version:    {int}, version of MultiWii
     *   multiType:  {int}, type of multicopter (multitype)
     *   mspVersion: {int}, MultiWii Serial Protocol version (not used)
     *   capability: {int}  indicate capability of FC board
     * }
     *
     * @param [callback=null] callback
     * @param {boolean} [cache=true] force load ident from multicopter protocol, not from cache
     * @returns {*}
     */
    Protocol.prototype.ident = function (callback, cache) {
        if (!this._cache.hasOwnProperty('ident') || cache === false) {
            this._cache.ident = this._packageManager.send(100, null, function (data) {
                return {
                    version   : data.readUInt8(0),
                    multiType : data.readUInt8(1),
                    mspVersion: data.readUInt8(2),
                    capability: data.readUInt32LE(3)
                };
            });
        }

        if (callback) {
            return callback(null, clone(this._cache.ident));
        }

        return clone(this._cache.ident);
    };

    /**
     *
     * Get status
     *
     * Data format
     * {
     *   cycleTime:            {int}, unit: microseconds
     *   12cErrorCount:        {int},
     *   sensorPresent:        {      sensor present
     *     acc:   {boolean},
     *     baro:  {boolean},
     *     mag:   {boolean},
     *     gps:   {boolean},
     *     sonar: {boolean}
     *   },
     *   boxActivation:        [],   indicates which BOX are activates (index order is depend on boxNames)
     *   currentSettingNumber: {}    to indicate the current configuration settings
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.status = function (callback) {
        var self;

        self = this;

        return this._packageManager.send(101, null, function (data) {
            var i, sensorPresentSum, boxActivationSum, boxActivation, boxNames;

            sensorPresentSum = data.readUInt16LE(4);
            boxActivationSum = data.readUInt32LE(6); // flag
            boxActivation = [];
            boxNames = self.boxNames();

            for (i = 0; i < boxNames.length; i++) {
                boxActivation[i] = (boxActivationSum & (1 << i)) > 0;
            }

            return {
                cycleTime           : data.readUInt16LE(0),
                i2cErrorCount       : data.readUInt16LE(2),
                sensorPresent       : {
                    acc  : (sensorPresentSum & 1) !== 0,
                    baro : (sensorPresentSum & 2) !== 0,
                    mag  : (sensorPresentSum & 4) !== 0,
                    gps  : (sensorPresentSum & 8) !== 0,
                    sonar: (sensorPresentSum & 16) !== 0
                },
                boxActivation       : boxActivation,
                currentSettingNumber: data.readUInt8(10)
            };
        }, callback);
    };

    /**
     * Get raw imu
     *
     * Data format
     * {
     *   gyro: {
     *     x: {int},
     *     y: {int},
     *     z: {int}
     *   },
     *   acc:  {
     *     x: {int},
     *     y: {int},
     *     z: {int}
     *   },
     *   mag:  {
     *     x: {int},
     *     y: {int},
     *     z: {int}
     *   }
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.rawImu = function (callback) {
        return this._packageManager.send(102, null, function (data) {
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

    /**
     *
     * Get individual servo state
     *
     * Data format
     * [int,int,int,int,int,int,int,int] range: [1000,2000] - order depends on multitype
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.servo = function (callback) {
        return this._packageManager.send(103, null, function (data) {
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

    /**
     *
     * Get individual motor throttle
     *
     * Data format
     * [int,int,int,int,int,int,int,int] range: [1000,2000] - order depends on multitype
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.motor = function (callback) {
        return this._packageManager.send(104, null, function (data) {
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

    /**
     *
     * Get live RC data
     *
     * Data format
     * {
     *   roll:     {int}, range: [1000,2000]
     *   pitch:    {int}, range: [1000,2000]
     *   yaw:      {int}, range: [1000,2000]
     *   throttle: {int}, range: [1000,2000]
     *   aux1:     {int}, range: [1000,2000]
     *   aux2:     {int}, range: [1000,2000]
     *   aux3:     {int}, range: [1000,2000]
     *   aux4:     {int}  range: [1000,2000]
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.rc = function (callback) {
        return this._packageManager.send(105, null, function (data) {
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

    /**
     *
     * Get raw GPS data
     *
     * Data format
     * {
     *   fix:          {boolean},
     *   numSat:       {int},
     *   coord:        {
     *     latitude:  {int},      unit: deg
     *     longitude: {int},      unit: deg
     *     altitude:  {int}       unit: m
     *   },
     *   speed:        {int},     unit: cm/s
     *   groundCourse: {int}      unit: deg
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.rawGPS = function (callback) {
        return this._packageManager.send(106, null, function (data) {
            return {
                fix         : data.readUInt8(0) === 1,
                numSat      : data.readUInt8(1),
                coord       : {
                    latitude : data.readUInt32LE(2) / 10000000,
                    longitude: data.readUInt32LE(6) / 10000000,
                    altitude : data.readUInt16LE(10)
                },
                speed       : data.readUInt16LE(12),
                groundCourse: data.readUInt16LE(14) / 10
            };
        }, callback);
    };

    /**
     *
     * Get computed GPS data
     *
     * Data format
     * {
     *   distanceToHome:  {int}, unit: m
     *   directionToHome: {int}, unit: deg - range: [-180,180]
     *   update:          {int}  flag to indicate when a new GPS frame received
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.compGPS = function (callback) {
        return this._packageManager.send(107, null, function (data) {
            return {
                distanceToHome : data.readUInt16LE(0),
                directionToHome: data.readUInt16LE(2),
                update         : data.readUInt8(4)
            };
        }, callback);
    };

    /**
     *
     * Get attitude
     *
     * Data format
     * {
     *   x:       {int}, unit: deg - range: [-1800-1800]
     *   y:       {int}, unit: deg - range: [-900-900]
     *   heading: {int}  range: [-180,180]
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.attitude = function (callback) {
        return this._packageManager.send(108, null, function (data) {
            return {
                x      : data.readInt16LE(0) / 10,
                y      : data.readInt16LE(2) / 10,
                heading: data.readInt16LE(4)
            };
        }, callback);
    };

    /**
     *
     * Get altitude
     *
     * Data format
     * {
     *   estimated: {int} unit: cm
     *   vario:     {int} unit: cm/s
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.altitude = function (callback) {
        return this._packageManager.send(109, null, function (data) {
            return {
                estimated: data.readInt32LE(0),
                vario    : data.readInt16LE(4)
            };
        }, callback);
    };

    /**
     * Get analog
     *
     * Data format
     * {
     *   vbat:             {int}, unit: volt
     *   intPowerMeterSum: {int},
     *   rssi:             {int}, range: [0,1023]
     *   amperage:         {int}
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.analog = function (callback) {
        return this._packageManager.send(110, null, function (data) {
            return {
                vbat            : data.readUInt8(0) / 10,
                intPowerMeterSum: data.readUInt16LE(1),
                rssi            : data.readUInt16LE(3),
                amperage        : data.readUInt16LE(5)
            };
        }, callback);
    };

    /**
     *
     * Get RC tuning
     *
     * Data format
     * {
     *   rcRate:         {int}, range: [0,100]
     *   rcExpo:         {int}, range: [0,100]
     *   rollPitchRate:  {int}, range: [0,100]
     *   yawRate:        {int}, range: [0,100]
     *   dynThrottlePID: {int}, range: [0,100]
     *   throttleMid:    {int}, range: [0,100]
     *   throttleExpo:   {int}  range: [0,100]
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.rcTuning = function (callback) {
        return this._packageManager.send(111, null, function (data) {
            return {
                rcRate        : data.readUInt8(0),
                rcExpo        : data.readUInt8(1),
                rollPitchRate : data.readUInt8(2),
                yawRate       : data.readUInt8(3),
                dynThrottlePID: data.readUInt8(4),
                throttleMid   : data.readUInt8(5),
                throttleExpo  : data.readUInt8(6)
            };
        }, callback);
    };

    /**
     *
     * Get PID settings
     *
     * Data format
     * {
     *   roll:     {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   pitch:    {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   yaw:      {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   altitude: {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   pos:      {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   posr:     {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   navr:     {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   level:    {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   mag:      {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   },
     *   vel:      {
     *     p: {int},
     *     i: {int},
     *     d: {int}
     *   }
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.pid = function (callback) {
        return this._packageManager.send(112, null, function (data) {
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
        return this._packageManager.send(113, null, function (data) {
            var i, box;

            box = [];
            for (i = 0; i < data.length; i = i + 2) {
                box[box.length] = data.readUInt16LE(i);
            }
            return box;
        }, callback);
    };

    /**
     *
     * Get misc
     *
     * Data format
     * {
     *   intPowerTrigger: {int}
     *   conf:            {
     *     minThrottle:      {int}, range: [1000,2000] - minimum throttle to run motor in idle state
     *     maxThrottle:      {int}, range: [1000,2000] - maximum throttle
     *     minCommand:       {int}, range: [1000,2000] - throttle at lowest position
     *     failSafeThrottle: {int}, range: [1000,2000] - should be set less than hover state
     *     magDeclination:   {int}, unit: deg - magnetic declination
     *     vbat: {
     *       scale: {int},
     *       level: {
     *         warn1:    {int},     unit: volt
     *         warn2:    {int},     unit: volt
     *         critical: {int}      unit: volt
     *       }
     *     },
     *     plog: {
     *       arm:      {int},       counter
     *       lifetime: {int}
     *     }
     *   }
     * }
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.misc = function (callback) {
        return this._packageManager.send(114, null, function (data) {
            return {
                intPowerTrigger: data.readUInt16LE(0),
                conf           : {
                    minThrottle     : data.readUInt16LE(2),
                    maxThrottle     : data.readUInt16LE(4),
                    minCommand      : data.readUInt16LE(6),
                    failSafeThrottle: data.readUInt16LE(8),
                    magDeclination  : data.readUInt16LE(16) / 10,
                    vbat            : {
                        scale: data.readUInt8(18),
                        level: {
                            warn1   : data.readUInt8(19) / 10,
                            warn2   : data.readUInt8(20) / 10,
                            critical: data.readUInt8(21) / 10
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

    /**
     *
     * Get motor pin indicator
     *
     * [int,int,int,int,int,int,int,int]
     *
     * @param [callback=null]
     * @returns {*}
     */
    Protocol.prototype.motorPins = function (callback) {
        return this._packageManager.send(115, null, function (data) {
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

    /**
     *
     * Get box names
     *
     * [string,string,string,string,string,string,string,string] - box names
     *
     * @param [callback=null]
     * @param [cache=true] force load box names from multicopter protocol, not from cache
     * @returns {*}
     */
    Protocol.prototype.boxNames = function (callback, cache) {
        if (!this._cache.hasOwnProperty('boxNames') || cache === false) {
            this._cache.boxNames = this._packageManager.send(116, null, function (data) {
                return data.toString().split(';').filter(function (value) {
                    return value !== '';
                });
            });
        }

        if (callback) {
            return callback(clone(this._cache.boxNames));
        }

        return clone(this._cache.boxNames);
    };

    Protocol.prototype.pidNames = function (callback, cache) {
        if (!this._cache.hasOwnProperty('pidNames') || cache === false) {
            this._cache.pidNames = this._packageManager.send(117, null, function (data) {
                return data.toString().split(';').filter(function (value) {
                    return value !== '';
                });
            });
        }

        if (callback) {
            return callback(null, clone(this._cache.pidNames));
        }

        return clone(this._cache.pidNames);
    };

    Protocol.prototype.wp = function (callback) {
        return this._packageManager.send(118, null, function (data) {
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
        return this._packageManager.send(119, null, function (data) {
            var i, boxIDs;

            boxIDs = [];
            for (i = 0; i < data.length; i = i + 1) {
                boxIDs[boxIDs.length] = data.readInt8(i);
            }

            return boxIDs;
        }, callback);
    };

    Protocol.prototype.servoConf = function (callback) {
        return this._packageManager.send(120, null, function (data) {
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

    Protocol.prototype.setRawRc = function (options, callback) {
        var data = new Buffer(16);

        data.writeUInt16LE(options.roll, 0);
        data.writeUInt16LE(options.pitch, 2);
        data.writeUInt16LE(options.yaw, 4);
        data.writeUInt16LE(options.throttle, 6);
        data.writeUInt16LE(options.aux1, 8);
        data.writeUInt16LE(options.aux2, 10);
        data.writeUInt16LE(options.aux3, 12);
        data.writeUInt16LE(options.aux4, 14);

        this._packageManager.send(200, data, null, callback);
    };

    Protocol.prototype.setRawGPS = function (options, callback) {
        var data = new Buffer(14);

        data.writeUInt8(options.fix ? 1 : 0, 0);
        data.writeUInt8(options.numSat, 1);
        data.writeUInt32LE(options.latitude * 10000000, 2);
        data.writeUInt32LE(options.longitude * 10000000, 6);
        data.writeUInt16LE(options.altitude, 10);
        data.writeUInt16LE(options.speed, 12);

        this._packageManager.send(201, data, null, callback);
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

        this._packageManager.send(202, data, null, callback);
    };

    Protocol.prototype.setBox = function (box, callback) {
        var i, data;

        data = new Buffer(box.length * 2);

        for (i = 0; i < box.length; i = i + 1) {
            data.writeUInt16LE(box[i]);
        }

        this._packageManager.send(203, data, null, callback);
    };

    Protocol.prototype.setRCTuning = function (options, callback) {
        var data = new Buffer(7);

        data.writeUInt8(options.rcRate, 0);
        data.writeUInt8(options.rcExpo, 1);
        data.writeUInt8(options.rollPitchRate, 2);
        data.writeUInt8(options.yawRate, 3);
        data.writeUInt8(options.dynThrottlePID, 4);
        data.writeUInt8(options.throttleMid, 5);
        data.writeUInt8(options.throttleExpo, 6);

        this._packageManager.send(204, data, null, callback);
    };

    Protocol.prototype.accCalibration = function (callback) {
        this._packageManager.send(205, null, null, callback);
    };

    Protocol.prototype.magCalibration = function (callback) {
        this._packageManager.send(206, null, null, callback);
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
        data.writeUInt8(options.vbat.level.warn1 * 10, 19);
        data.writeUInt8(options.vbat.level.warn2 * 10, 20);
        data.writeUInt8(options.vbat.level.critical * 10, 21);

        this._packageManager.send(207, data, null, callback);
    };

    Protocol.prototype.resetConf = function (callback) {
        this._packageManager.send(208, null, null, callback);
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

        this._packageManager.send(209, data, null, callback);
    };

    Protocol.prototype.selectSetting = function (currentSet, callback) {
        var data = new Buffer(1);

        data.writeUInt8(currentSet, 0);

        this._packageManager.send(210, data, null, callback);
    };

    Protocol.prototype.setHead = function (head, callback) {
        var data = new Buffer(2);

        data.writeInt16LE(head, 0);

        this._packageManager.send(211, data, null, callback);
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

        this._packageManager.send(212, data, null, callback);
    };

    return {
        TcpProtocol      : TcpProtocol,
        TcpPackageManager: TcpPackageManager,
        Protocol         : Protocol
    };
}();