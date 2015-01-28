(function ($, undefined) {
    "use strict";

    var readPid = function (callback) {
        if (Session.get('mspConnectedDevice')) {
            Meteor.call('mspPid', Session.get('mspConnectedDevice'), function (error, response) {
                Session.set('mspPid', response);

                notify('PID settings read', 'success');
            });
        } else {
            notify('No device connected', 'error');
        }

        if (callback !== undefined && callback !== null) {
            callback();
        }
    };

    Template.home.events(
        {
            "click .js-btn-read-settings" : function (e, template) {
                $(e.target).button('loading');
                readPid(function () {
                    $(e.target).button('reset');
                });
            },
            "click .js-btn-write-settings": function (e, template) {
                $(e.target).button('loading');
                readPid(function () {
                    $(e.target).button('reset');
                });
            }
        });
}(jQuery));