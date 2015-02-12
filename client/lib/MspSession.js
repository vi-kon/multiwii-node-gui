/**
 *
 * @typedef {object} Msp~session
 *
 * @property {string}   connectedDeviceName
 * @property {string}   lastConnectedDeviceName
 * @property {object}   data
 * @property {int}      data.time
 * @property {object}   data.status
 * @property {object}   data.rawImu
 * @property {object}   data.rc
 * @property {object}   data.rawGps
 * @property {object}   data.compGps
 * @property {object}   data.attitude
 * @property {object}   data.altitude
 * @property {object}   data.analog
 * @property {object}   availableDeviceNames
 * @property {string[]} boxNames
 */

/**
 * @global
 * @type {Msp~session}
 */
MspSession = (function () {
    var session, generateDescriptor;
    generateDescriptor = function (name) {
        return {
            get: function () {
                Session.get(name);
            },
            set: function (value) {
                Session.set(name, value);
            }
        };
    };

    session = {};
    Object.defineProperties(session, {
        connectedDeviceName    : generateDescriptor('mspConnectedDeviceName'),
        lastConnectedDeviceName: generateDescriptor('mspLastConnectedDeviceName'),
        data                   : generateDescriptor('mspData'),
        availableDeviceNames   : generateDescriptor('mspAvailableDeviceNames'),
        boxNames               : generateDescriptor('mspBoxNames')
    });

    return session;
}());