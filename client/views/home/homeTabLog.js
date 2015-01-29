(function (undefined) {
    "use strict";

    Template.homeTabLog.events(
        {
            'click .js-btn-read-log': function (e) {
                $(e.target).button('loading');
                Meteor.call('mspLog', Session.get('mspConnectedDeviceName'), function (error, response) {
                    Session.set('mspLog', response);
                    notify('Log read', 'success');
                    $(e.target).button('reset');
                });
            }
        });
}());