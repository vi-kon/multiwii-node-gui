(function ($) {
    "use strict";

    var tabActive;

    function setControlBtnActiveToDefault() {
        Session.set('controlBtnActive', {
            87 : false, // w
            83 : false, // s
            65 : false, // a
            68 : false, // d
            81 : false, // q
            69 : false, // e
            107: false, // +
            109: false  // -
        });
    }

    Template.homeTabFly.helpers({
                                    mspBoxNames       : function () {
                                        return Session.get('mspBoxNames').map(function (value, index) {
                                            return {index: index, value: value};
                                        });
                                    },
                                    mspBoxActive      : function (boxIndex) {
                                        return Session.get('mspActualData').status.boxActivation[boxIndex];
                                    },
                                    isControlBtnActive: function (button) {
                                        return false;
                                    }
                                });

    Template.home.events({
                             'shown.bs.tab a[data-toggle="tab"]': function (e) {
                                 if ($(e.target).attr('href') === '#tab-fly') {
                                     tabActive = true;
                                 } else {
                                     tabActive = false;
                                     setControlBtnActiveToDefault();
                                 }

                             }
                         });

    Template.homeTabFly.rendered = function () {
        setControlBtnActiveToDefault();
        $('body')
            .on('keydown', function (e) {
                    var controlBtnActive;

                    controlBtnActive = Session.get('controlBtnActive');

                    if (tabActive) {
                        if (controlBtnActive.hasOwnProperty(e.keyCode)) {
                            e.preventDefault();
                            controlBtnActive[e.keyCode] = true;
                            Session.set('controlBtnActive', controlBtnActive);
                        }
                    }
                    console.log(e.keyCode);
                })
            .on('keyup', function (e) {
                    var controlBtnActive;

                    controlBtnActive = Session.get('controlBtnActive');

                    if (tabActive) {
                        if (controlBtnActive.hasOwnProperty(e.keyCode)) {
                            e.preventDefault();
                            controlBtnActive[e.keyCode] = false;
                            Session.set('controlBtnActive', controlBtnActive);
                        }
                    }
                })
        $(window).on('blur', function (e) {
            setControlBtnActiveToDefault();
        });

        Tracker.autorun(function () {
            console.log(Session.get('controlBtnActive'));
        });
    };

    tabActive = false;
}(jQuery));