(function () {
    "use strict";

    Template.home.helpers({
                              isTabActive         : function (tab) {
                                  return Session.get('activeTab') === '#' + tab;
                              },
                              mspConnectedDevice  : function () {
                                  return Session.get('mspConnectedDevice');
                              },
                              mspOpenedDeviceNames: function () {
                                  return Session.get('mspOpenedDeviceNames');
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

    Template.home.events({
                             "click .js-btn-refresh-devices-list": function () {
                                 Meteor.call('mspOpenedProtocolNames', function (error, response) {
                                     Session.set('mspOpenedDeviceNames', response);
                                     notify('Device list refreshed', 'success');
                                 });
                             },
                             "click .js-btn-connect"             : function () {
                                 var value = $('.js-select-devices').val();
                                 if (value) {
                                     Session.set('mspConnectedDevice', value);
                                     notify('Device ' + value + ' connected', 'success');
                                 } else {
                                     notify('No available device for connection', 'error');
                                 }
                             },
                             "click .js-btn-disconnect"          : function () {
                                 if (Session.get('mspConnectedDevice')) {
                                     notify('Device ' + Session.get('mspConnectedDevice') + ' disconnected', 'success');
                                     Session.set('mspConnectedDevice', null);
                                 }
                             }
                         });
}());