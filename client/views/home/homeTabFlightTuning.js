var homeEvents;

function readPid(callback) {
    if (Session.get('mspActiveDeviceName')) {
        Meteor.call('mspPid', Session.get('mspActiveDeviceName'), function (error, response) {
            if (error) {
                notify('Error during PID setings read', 'error');
            } else {
                Session.set('mspPid', response);
                notify('PID settings read', 'success');

                if (callback !== undefined && callback !== null) {
                    callback();
                }
            }
        });
    } else {
        notify('No device connected', 'error');

        if (callback !== undefined && callback !== null) {
            callback();
        }
    }
}

homeEvents = {};

homeEvents['click .js-btn-read-settings'] = function (e, template) {
    $(e.target).button('loading');
    readPid(function () {
        $(e.target).button('reset');
    });
};
homeEvents['click .js-btn-write-settings'] = function (e, template) {
    $(e.target).button('loading');
    readPid(function () {
        $(e.target).button('reset');
    });
};

Template.home.events(homeEvents);