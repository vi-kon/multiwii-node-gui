var homeTabLogEvents;

homeTabLogEvents = {};

homeTabLogEvents['click .js-btn-read-log'] = function (e) {
    $(e.target).button('loading');
    Meteor.call('mspLog', Session.get('mspActiveDeviceName'), function (error, response) {
        if (error) {
            notify('Error during log read', 'error');
        } else {
            Session.set('mspLog', response);
            notify('Log read', 'success');
        }
        $(e.target).button('reset');
    });
};

Template.homeTabLog.events(homeTabLogEvents);