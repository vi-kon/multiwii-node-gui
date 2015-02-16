var homeTabRcSettingsHelpers, homeTabRcSettingsEvents, homeCommandRcSettingsEvents;

homeTabRcSettingsHelpers = {};

homeTabRcSettingsHelpers.boxNames = function () {
    if (Session.get('mspBoxNames')) {
        return Session.get('mspBoxNames').map(function (value, index) {
            return {
                index: index,
                value: value
            };
        });
    }

    return [];
};

homeTabRcSettingsHelpers.boxClass = function (box, aux, stick) {
    if (Session.get('mspBox')) {
        if (Session.get('mspBox')[box][aux][stick] !== Session.get('mspBoxChanges')[box][aux][stick]) {
            return 'btn-warning';
        }
        if (Session.get('mspBox')[box][aux][stick]) {
            return 'btn-success';
        }
    }

    return 'btn-default';
};

homeTabRcSettingsEvents = {};

/**
 *
 * Click event
 *
 * Change box channel setting to true or false
 *
 * @param e
 */
homeTabRcSettingsEvents['click .js-btn-box'] = function (e) {
    var box, boxIndex, aux, stick;

    box = Session.get('mspBoxChanges');

    boxIndex = $(e.target.parentNode.parentNode).index();
    aux = 'aux' + (Math.floor(($(e.target.parentNode).index() - 1) / 3) + 1);
    stick = ($(e.target.parentNode).index() - 1) % 3;
    switch (stick) {
        case 0:
            stick = 'low';
            break;
        case 1:
            stick = 'mid';
            break;
        case 2:
            stick = 'high';
            break;
    }

    box[boxIndex][aux][stick] = !box[boxIndex][aux][stick];
    Session.set('mspBoxChanges', box);
};

Template.homeTabRcSettings.helpers(homeTabRcSettingsHelpers);
Template.homeTabRcSettings.events(homeTabRcSettingsEvents);

homeCommandRcSettingsEvents = {};

/**
 *
 * Click event
 *
 * Read box settings from flight controller
 *
 * @param e
 */
homeCommandRcSettingsEvents['click .js-btn-read-device-rc-settings'] = function (e) {
    $(e.target).button('loading');
    Meteor.call('mspDeviceBox', Session.get('mspConnectedDeviceName'), function (error, response) {
        if (!error) {
            Session.set('mspBox', response);
            Session.set('mspBoxChanges', response);
            notify('RC settings read', 'success');
        } else {
            notify('Error during read RC settings', 'error');
        }
        $(e.target).button('reset');
    });
};

/**
 * Click event
 *
 * Write to Flight Controller box settings
 *
 * @param e
 */
homeCommandRcSettingsEvents['click .js-btn-write-device-rc-settings'] = function (e) {
    $(e.target).button('loading');
    Meteor.call('mspSetDeviceBox', Session.get('mspConnectedDeviceName'), Session.get('mspBoxChanges'), function (error) {
        if (!error) {
            Session.set('mspBox', Session.get('mspBoxChanges'));
            notify('RC settings write', 'success');
        } else {
            notify('Error during write RC settings', 'error');
        }
        $(e.target).button('reset');
    });
};

/**
 *
 * Click event
 *
 * Reset box setting to default
 *
 * @param e
 */
homeCommandRcSettingsEvents['click .js-btn-reset-device-rc-settings'] = function (e) {
    var i, boxChanges;

    $(e.target).button('loading');

    boxChanges = Session.get('mspBoxChanges');
    console.log(boxChanges);
    for (i = 0; i < boxChanges.length; i = i + 1) {
        boxChanges[i].aux1.low = false;
        boxChanges[i].aux1.mid = false;
        boxChanges[i].aux1.high = false;

        boxChanges[i].aux2.low = false;
        boxChanges[i].aux2.mid = false;
        boxChanges[i].aux2.high = false;

        boxChanges[i].aux3.low = false;
        boxChanges[i].aux3.mid = false;
        boxChanges[i].aux3.high = false;

        boxChanges[i].aux4.low = false;
        boxChanges[i].aux4.mid = false;
        boxChanges[i].aux4.high = false;
    }

    $(e.target).button('reset');
};

Template.homeCommandRcSettings.events(homeCommandRcSettingsEvents);