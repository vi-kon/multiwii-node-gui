var homeTabEvents, homeCommandTabFlyHelpers, homeCommandTabFlyEvents, tabActive, tabInitialized,
    map, resetActiveControlBtnSet, sendRawRc;

tabActive = false;
tabInitialized = false;

homeTabEvents = {};

homeTabEvents['shown.bs.tab a[data-toggle="tab"]'] = function (e) {
    if ($(e.target).attr('href') !== '#tab-fly') {
        tabActive = false;
    } else {
        tabActive = true;

        if (!tabInitialized) {
            map = createMap('map-canvas-fly');

            tabInitialized = true;
        }
    }
};

homeCommandTabFlyHelpers = {};

homeCommandTabFlyHelpers.isTcpRcOn = function () {
    return Session.get('mspTcpRc');
};

homeCommandTabFlyHelpers.tcpRcPing = function () {
    return Session.get('mspTcpRcPing');
};

homeCommandTabFlyEvents = {};

homeCommandTabFlyEvents['click .js-btn-start-tcp-rc'] = function () {
    Session.set('mspTcpRc', true);
    Session.set('mspTcpRcPing', 0);
};

homeCommandTabFlyEvents['click .js-btn-stop-tcp-rc'] = function () {
    Session.set('mspTcpRc', false);
};

Template.home.events(homeTabEvents);
Template.homeCommandTabFly.helpers(homeCommandTabFlyHelpers);
Template.homeCommandTabFly.events(homeCommandTabFlyEvents);

resetActiveControlBtnSet = function () {
    Session.set('controlActiveBtnSet', {
        87 : false, // w
        83 : false, // s
        65 : false, // a
        68 : false, // d
        81 : false, // q
        69 : false, // e
        107: false, // +
        109: false  // -
    });
};
resetActiveControlBtnSet();

sendRawRc = function () {
    var rc;

    rc = {
        roll    : 1500, // left, right
        pitch   : 1500, // forward, back
        yaw     : 1500, // rotate left, rotate right
        throttle: 1000,
        aux1    : 1500,
        aux2    : 1500,
        aux3    : 1500,
        aux4    : 1500
    };
    Meteor.call('mspSetDeviceRawRc', Session.get('mspConnectedDeviceName'), rc, function (error) {
        if (!error && Session.get('mspConnectedDeviceName')) {
            sendRawRc();
        }
    });
};

Template.homeTabFly.rendered = function () {
    $('body')
        .on('keydown', function (e) {
            var controlActiveBtnSet = Session.get('controlActiveBtnSet');

            if (tabActive && Session.get('mspTcpRc') && controlActiveBtnSet.hasOwnProperty(e.keyCode)) {
                e.preventDefault();
                controlActiveBtnSet[e.keyCode] = true;
                Session.set('controlActiveBtnSet', controlActiveBtnSet);
            }
        })
        .on('keyup', function (e) {
            var controlActiveBtnSet = Session.get('controlActiveBtnSet');

            if (tabActive && Session.get('mspTcpRc') && controlActiveBtnSet.hasOwnProperty(e.keyCode)) {
                e.preventDefault();
                controlActiveBtnSet[e.keyCode] = false;
                Session.set('controlActiveBtnSet', controlActiveBtnSet);
            }
        });

    $(window).on('blur', function () {
        resetActiveControlBtnSet();
    });
};

Tracker.autorun(function () {
    // TODO: need to handle disconnect
});

Tracker.autorun(function () {
    if (Session.get('mspTcpRc')) {
        sendRawRc();
    }
});