(function () {
    "use strict";

    var stream, mspConnectedDeviceName;

    Template.home.helpers(
        {
            isTabActive         : function (tab) {
                return Session.get('activeTab') === '#' + tab;
            },
            mspConnectedDevice  : function () {
                return Session.get('mspConnectedDeviceName');
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
                            Session.set('mspConnectedDeviceName', value);
                            notify('Device ' + value + ' connected', 'success');
                        } else {
                            notify('Connection lost', 'error');
                        }
                        $(e.target).button('reset');
                    });
                } else {
                    notify('No available device for connection', 'error');
                }
            },
            "click .js-btn-disconnect"          : function () {
                if (Session.get('mspConnectedDeviceName')) {
                    notify('Device ' + Session.get('mspConnectedDeviceName') + ' disconnected', 'success');
                    Session.set('mspConnectedDeviceName', null);
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

    mspConnectedDeviceName = null;
    stream = new Meteor.Stream('msp');

    stream.on('close', function (deviceName) {
        if (mspConnectedDeviceName === deviceName) {
            Session.set('mspConnectedDeviceName', null);
            notify('Connection lost', 'error');
        }
    });

    Tracker.autorun(function () {
        if (Session.get('mspConnectedDeviceName')) {
            mspConnectedDeviceName = Session.get('mspConnectedDeviceName');
            stream.on('update' + mspConnectedDeviceName, function (data) {
                Session.set('mspActualData', data);
            });
        } else if (mspConnectedDeviceName !== null) {
            stream.removeAllListeners('update' + mspConnectedDeviceName);
            mspConnectedDeviceName = null;
        }
    });
}());