(function () {
    "use strict";

    var stream, mspActiveDeviceName;

    Template.home.helpers(
        {
            isTabActive         : function (tab) {
                return Session.get('activeTab') === '#' + tab;
            },
            mspConnectedDevice  : function () {
                return Session.get('mspActiveDeviceName');
            },
            mspOpenedDeviceNames: function () {
                return Session.get('mspOpenedDeviceNames');
            },
            mspCycleTime        : function () {
                return Session.get('mspActualData').cycleTime;
            }
        });

    Template.home.events(
        {
            "click .js-btn-refresh-devices-list": function (e) {
                $(e.target).button('loading');
                Meteor.call('mspOpenedProtocolNames', function (error, response) {
                    Session.set('mspOpenedDeviceNames', response);
                    notify('Device list refreshed', 'success');
                    $(e.target).button('reset');
                });
            },
            "click .js-btn-connect"             : function (e) {
                var value = $('.js-select-devices').val();
                if (value) {
                    $(e.target).button('loading');
                    Meteor.call('mspIsConnected', value, function (error, response) {
                        if (response) {
                            Session.set('mspActiveDeviceName', value);
                            notify('Device ' + value + ' connected', 'success');
                        } else {
                            notify('Connection lost', 'error');
                        }
                        $(e.target).button('reset');
                    });
                } else {
                    notify('No available device for connection', 'error');
                }
                Session.set('mspLastConnectedDeviceName', null);
            },
            "click .js-btn-disconnect"          : function () {
                if (Session.get('mspActiveDeviceName')) {
                    notify('Device ' + Session.get('mspActiveDeviceName') + ' disconnected', 'success');
                    Session.set('mspActiveDeviceName', null);
                    Session.set('mspLastConnectedDeviceName', null);
                }
            }
        });

    Template.home.rendered = function () {
        var hash = window.location.hash;
        hash && $('ul.nav a[href="' + hash + '"]').tab('show');

        Meteor.call('mspOpenedProtocolNames', function (error, response) {
            Session.set('mspOpenedDeviceNames', response);
        });

        $('body').on('click', '.nav-tabs a', function () {
            if (history.pushState) {
                history.pushState(null, null, this.hash);
            } else {
                var element = $('html, body');
                var scrollPos = element.scrollTop();
                $(this).tab('show');
                window.location.hash = this.hash;
                element.scrollTop(scrollPos);
            }
        });

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            Session.set('activeTab', $(e.target).attr('href'));
        });
    };

    mspActiveDeviceName = null;
    stream = new Meteor.Stream('msp');

    stream.on('open', function (deviceName) {
        if (Session.get('mspLastConnectedDeviceName') === deviceName) {
            Session.set('mspActiveDeviceName', deviceName);
            Session.set('mspLastConnectedDeviceName', null);
            notify('Device ' + deviceName + ' reconnected', 'success');
        }
    });

    stream.on('close', function (deviceName) {
        if (mspActiveDeviceName === deviceName) {
            Session.set('mspLastConnectedDeviceName', mspActiveDeviceName);
            Session.set('mspActiveDeviceName', null);
            notify('Connection lost', 'error');
        }
    });

    Tracker.autorun(function () {
        if (Session.get('mspActiveDeviceName')) {
            mspActiveDeviceName = Session.get('mspActiveDeviceName');
            stream.on('update' + mspActiveDeviceName, function (data) {
                Session.set('mspActualData', data);
            });
        } else if (mspActiveDeviceName !== null) {
            stream.removeAllListeners('update' + mspActiveDeviceName);
            mspActiveDeviceName = null;
        }
    });

    console.log(Session.get('mspActualData').status);

    Meteor.call('mspBox', Session.get('mspActiveDeviceName'), function (error, response) {
        console.log('Box', response);
    });

    Meteor.call('mspBoxNames', Session.get('mspActiveDeviceName'), function (error, response) {
        console.log('Box names', response);
    });
}());