var mspStream, homeHelpers, homeEvents, mspConnectedDeviceName;

mspStream = new Meteor.Stream('msp');

homeHelpers = {};

homeHelpers.isTabActive = function (tab) {
    return Session.get('homeActiveTab') === '#' + tab;
};

homeHelpers.mspIsConnected = function () {
    return Session.get('mspConnectedDeviceName') !== null;
};

homeHelpers.mspConnectedDeviceName = function () {
    return Session.get('mspConnectedDeviceName');
};

homeHelpers.mspAvailableDeviceNames = function () {
    return Session.get('mspAvailableDeviceNames');
};

homeHelpers.mspCycleTime = function () {
    return Session.get('mspData').cycleTime;
};

homeEvents = {};

homeEvents['click .js-btn-refresh-devices-list'] = function (e) {
    $(e.target).button('loading');
    Meteor.call('mspAvailableDeviceNames', function (error, response) {
        if (error) {
            notify('Error during device list refresh', 'error');
        } else {
            Session.set('mspAvailableDeviceNames', response);
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
                    Session.set('mspBoxNames', response);
                });
                Session.set('mspConnectedDeviceName', name);
                notify('Device ' + name + ' connected', 'success');
            } else {
                notify('Connection lost', 'error');
            }
            $(e.target).button('reset');
        });
    } else {
        notify('No available device for connection', 'error');
    }
    Session.set('mspLastConnectedDeviceName', null);
};

homeEvents['click .js-btn-disconnect'] = function () {
    if (Session.get('mspConnectedDeviceName')) {
        notify('Device ' + Session.get('mspConnectedDeviceName') + ' disconnected', 'success');

        Session.set('mspConnectedDeviceName', null);
        Session.set('mspLastConnectedDeviceName', null);
    }
};

mspConnectedDeviceName = null;

Template.home.helpers(homeHelpers);
Template.home.events(homeEvents);

Template.home.rendered = function () {
    var hash;

    hash = window.location.hash;
    $('ul.nav a[href="' + hash + '"]').tab('show');

    Meteor.call('mspOpenedDeviceNames', function (error, response) {
        if (!error) {
            Session.set('mspOpenedDeviceNames', response);
        }
    });

    $('body').on('click', '.nav-tabs a', function () {
        var element, scrollPos;
        if (history.pushState) {
            history.pushState(null, null, this.hash);
        } else {
            element = $('html, body');
            scrollPos = element.scrollTop();
            $(this).tab('show');
            window.location.hash = this.hash;
            element.scrollTop(scrollPos);
        }
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        Session.set('homeActiveTab', $(e.target).attr('href'));
    });
};

mspStream.on('open', function (name) {
    if (Session.get('mspLastConnectedDeviceName') === name) {
        Session.set('mspConnectedDeviceName', name);
        Session.set('mspLastConnectedDeviceName', null);
        notify('Device ' + name + ' reconnected', 'success');
    }
});

mspStream.on('close', function (name) {
    if (mspConnectedDeviceName === name) {
        Session.set('mspLastConnectedDeviceName', mspConnectedDeviceName);
        Session.set('mspConnectedDeviceName', null);
        notify('Connection lost', 'error');
    }
});

Tracker.autorun(function () {
    if (Session.get('mspConnectedDeviceName')) {
        mspConnectedDeviceName = Session.get('mspConnectedDeviceName');
        mspStream.on('update' + mspConnectedDeviceName, function (data) {
            Session.set('mspData', data);
        });
    } else if (mspConnectedDeviceName !== null) {
        mspStream.removeAllListeners('update' + mspConnectedDeviceName);
        mspConnectedDeviceName = null;
    }
});