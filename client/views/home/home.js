var homeHelpers, homeEvents;

homeHelpers = {};

homeHelpers.isTabActive = function (tab) {
    return Session.get('homeActiveTab') === '#' + tab;
};

homeHelpers.isMspDeviceConnected = function () {
    return MspSession.connectedDeviceName;
};

homeHelpers.getAvailableMspDeviceNames = function () {
    return MspSession.availableDeviceNames;
};

homeHelpers.getMspDataCycleTime = function () {
    return MspSession.data.cycleTime;
};

homeEvents = {};

homeEvents['click .js-btn-refresh-devices-list'] = function (e) {
    $(e.target).button('loading');
    Meteor.call('mspAvailableDeviceNames', function (error, response) {
        if (error) {
            notify('Error during device list refresh', 'error');
            console.log(error);
        } else {
            MspSession.availableDeviceNames = response;
            notify('Device list refreshed', 'success');
        }
        $(e.target).button('reset');
    });
};

homeEvents['click .js-btn-connect'] = function (e) {
    var name = $('.js-select-devices').val();
    if (name) {
        $(e.target).button('loading');
        Meteor.call('mspIsConnected', name, function (error, response) {
            if (!error && response) {
                Meteor.call('mspBoxNames', name, function (error, response) {
                    if (!error) {
                        MspSession.boxNames = response;
                    }
                });
                MspSession.connectedDeviceName = name;
                MspSession.lastConnectedDeviceName = name;
                notify('Device ' + name + ' connected', 'success');
            } else {
                notify('Connection lost', 'error');
            }
            $(e.target).button('reset');
        });
    } else {
        notify('No available device for connection', 'error');
    }
};

homeEvents['click .js-btn-disconnect'] = function () {
    if (MspSession.connectedDeviceName) {
        notify('Device ' + MspSession.connectedDeviceName + ' disconnected', 'success');

        MspSession.connectedDeviceName = null;
        MspSession.lastConnectedDeviceName = null;
    } else {
        notify('No device is connected', 'error');
    }
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

Template.home.helpers(homeHelpers);
Template.home.events(homeEvents);

Template.home.rendered = function () {
    $('.nav-tabs a[href="' + window.location.hash + '"]').tab('show');

    Meteor.call('mspOpenedDeviceNames', function (error, response) {
        if (!error) {
            MspSession.availableDeviceNames = response;
        }
    });
};