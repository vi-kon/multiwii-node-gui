(function (undefined) {
    "use strict";

    Template.homeTabLog.events(
        {
            'click .js-btn-read-log': function () {
                Meteor.call('mspLog', Session.get('mspConnectedDevice'), function (error, response) {
                    Session.set('mspLog', response);
                    notify('Log read', 'success');
                });
            }
        });
}());