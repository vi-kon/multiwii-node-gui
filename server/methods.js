(function (undefined) {
    "use strict";

    var isMspOpenedProtocols = function (name) {
        return mspOpenedProtocols.hasOwnProperty(name) && mspOpenedProtocols[name].isConnected();
    }

    Meteor.methods({
                       mspOpenedProtocolNames: function () {
                           var keys = [];
                           for (var name in mspOpenedProtocols) {
                               keys.push({
                                             name   : name,
                                             version: mspOpenedProtocols[name].ident().version
                                         });
                           }

                           return keys;
                       },
                       mspIsConnected        : function (name) {
                           return isMspOpenedProtocols(name);
                       },
                       mspLog                : function (name) {
                           return mspOpenedProtocols[name].log();
                       },
                       mspIdent              : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].ident();
                           }
                           return null;
                       },
                       mspStatus             : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].status();
                           }
                           return null;
                       },
                       mspRawImu             : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].rawImu();
                           }
                           return null;
                       },
                       mspServo              : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].servo();
                           }
                           return null;
                       },
                       mspMotor              : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].motor();
                           }
                           return null;
                       },
                       mspRc                 : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].rc();
                           }
                           return null;
                       },
                       mspRawGPS             : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].rawGPS();
                           }
                           return null;
                       },
                       mspCompGPS            : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].compGPS();
                           }
                           return null;
                       },
                       mspAttitude           : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].attitude();
                           }
                           return null;
                       },
                       mspAltitude           : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].altitude();
                           }
                           return null;
                       },
                       mspAnalog             : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].analog();
                           }
                           return null;
                       },
                       mspRcTuning           : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].rcTuning();
                           }
                           return null;
                       },
                       mspPid                : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].pid();
                           }
                           return null;
                       },
                       mspBox                : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].box();
                           }
                           return null;
                       },
                       mspMisc               : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].misc();
                           }
                           return null;
                       },
                       mspMotorPins          : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].motorPins();
                           }
                           return null;
                       },
                       mspBoxNames           : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].boxNames();
                           }
                           return null;
                       },
                       mspPidNames           : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].pidNames();
                           }
                           return null;
                       },
                       mspWp                 : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].wp();
                           }
                           return null;
                       },
                       mspBoxIDs             : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].boxIDs();
                           }
                           return null;
                       },
                       mspServoConf          : function (name) {
                           if (isMspOpenedProtocols(name)) {
                               return mspOpenedProtocols[name].servoConf();
                           }
                           return null;
                       },
                       mspSetRawRc           : function (name, options) {
                       },
                       mspSetRawGPS          : function (name, options) {
                       },
                       mspSetPid             : function (name, options) {
                       },
                       mspSetBox             : function (name, options) {
                       },
                       mspSetRcTuning        : function (name, options) {
                       },
                       mspAccCalibration     : function (name) {
                       },
                       mspMagCalibration     : function (name) {
                       },
                       mspSetMisc            : function (name, options) {
                       },
                       mspResetConf          : function (name) {
                       },
                       mspSetWp              : function (name, options) {
                       },
                       mspSelectSetting      : function (name, options) {
                       },
                       mspSetHead            : function (name, options) {
                       },
                       mspSetServoConf       : function (name, options) {
                       }
                   });
}());