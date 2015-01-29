(function () {
    "use strict";

    Template.homeTabGeneral.helpers(
        {
            horizonRollAngle : function () {
                return -Session.get('mspActualData').attitude.x / 10;
            },
            horizonPitchAngle: function () {
                return Session.get('mspActualData').attitude.y / 10;
            }
        });
}());