var homeHelpers = {};
var homeEvents = {};

homeHelpers.isTabActive = function (name) {
    return Session.get('homeActiveTab') === name;
};

homeHelpers.mspIsDeviceConnected = function () {
    return false;
};

homeHelpers.mspAvailableDeviceNames = function () {
    return [];
};

homeHelpers.mspConnectedDeviceName = function () {
    return '192.168.0.1:3002';
};

homeHelpers.mspCycleTime = function () {
    return 100;
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

    $(e.target).button('reset');
};

homeEvents['click .js-btn-device-connect'] = function (e) {
    $(e.target).button('loading');

    $(e.target).button('reset');
};

homeEvents['click .js-btn-device-disconnect'] = function (e) {
    $(e.target).button('loading');

    $(e.target).button('reset');
};

Template.home.rendered = function () {
    this.$('ul.nav a[href="' + window.location.hash + '"]').tab('show');
};
Template.home.helpers(homeHelpers);
Template.home.events(homeEvents);