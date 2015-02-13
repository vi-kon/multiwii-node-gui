var homeHelpers = {};
var homeEvents = {};

homeHelpers.isTabActive = function (name) {
    return Session.get('homeActiveTab') === name;
};

homeHelpers.mspIsDeviceConnected = function () {
    return Session.get('mspConnectedDeviceName');
};

homeHelpers.mspAvailableDeviceNames = function () {
    return Session.get('mspAvailableDeviceNames');
};

homeHelpers.mspConnectedDeviceName = function () {
    return Session.get('mspConnectedDeviceName');
};

homeHelpers.mspCycleTime = function () {
    return Session.get('mspData').cycleTime;
};

homeEvents['click .nav-tabs a'] = function (e) {
    var element, scrollPos;

    if (history.pushState) {
        history.pushState(null, null, e.target.hash);
    } else {
        element = $('html, body');
        scrollPos = element.scrollTop();
        $(e.target).tab('show');
        window.location.hash = e.target.hash;
        element.scrollTop(scrollPos);
    }
};

homeEvents['shown.bs.tab a[data-toggle="tab"]'] = function (e) {
    Session.set('homeActiveTab', e.target.href);
};

homeEvents['click .js-btn-refresh-devices-list'] = function (e) {
    $(e.target).button('loading');

    Meteor.call('mspListAvailableDeviceNames', function (error, deviceNames) {
        if (error) {
            console.log(error);
            notify('Error during device list refresh', 'error');
        } else {
            Session.set('mspAvailableDeviceNames', deviceNames);
            notify('Device list refreshed', 'success');
        }
        $(e.target).button('reset');
    });
};

homeEvents['click .js-btn-device-connect'] = function (e, template) {
    var deviceName = template.find('.js-select-devices-list').value;

    if (deviceName) {
        $(e.target).button('loading');

        Meteor.call('mspIsDeviceAvailable', deviceName, function (error, isAvailable) {
            if (error) {
                console.log('mspIsDeviceAvailable', error);
                notify('Error during connection', 'error');
            } else if (!isAvailable) {
                notify('Connection lost', 'error');
            } else {
                Meteor.call('mspDeviceBoxNames', deviceName, function (error, response) {
                    if (error) {
                        console.log('mspDeviceBoxNames', error);
                    } else {
                        Session.set('mspBoxNames', response);
                    }
                });
                Session.set('mspConnectedDeviceName', deviceName);
                notify('Device ' + deviceName + ' connected', 'success');
            }
        });

        $(e.target).button('reset');
    } else {
        notify('No available device for connection', 'error');
    }
};

homeEvents['click .js-btn-device-disconnect'] = function (e) {
    var deviceName = Session.get('mspConnectedDeviceName');

    if (deviceName) {
        $(e.target).button('loading');

        Session.set('mspConnectedDeviceName', null);

        notify('Device ' + deviceName + ' disconnected', 'success');

        $(e.target).button('reset');
    }
};

Template.home.rendered = function () {
    this.$('ul.nav a[href="' + window.location.hash + '"]').tab('show');

    Meteor.call('mspListAvailableDeviceNames', function (error, deviceNames) {
        if (error) {
            console.log('mspListAvailableDeviceNames', error);
        } else {
            Session.set('mspAvailableDeviceNames', deviceNames);
        }
    });
};

Template.home.helpers(homeHelpers);
Template.home.events(homeEvents);