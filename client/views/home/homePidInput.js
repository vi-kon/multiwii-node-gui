(function ($, undefined) {
    "use strict";

    var inc, dec, change;

    Template.homePidInput.helpers(
        {
            mspPidSettingP: function (type) {
                if (Session.get('mspPid') === undefined) {
                    return (0).toFixed(1);
                }
                return (Session.get('mspPid')[type].p / 10).toFixed(1);
            },
            mspPidSettingI: function (type) {
                if (Session.get('mspPid') === undefined) {
                    return (0).toFixed(3);
                }
                return (Session.get('mspPid')[type].i / 1000).toFixed(3);
            },
            mspPidSettingD: function (type) {
                if (Session.get('mspPid') === undefined) {
                    return 0;
                }
                return Session.get('mspPid')[type].d;
            }
        });

    Template.homePidInput.events(
        {
            "click .js-btn-p-dec": function (e, template) {
                dec('input[name$=_p]', template, 0, 0.1, 1);
            },
            "click .js-btn-p-inc": function (e, template) {
                inc('input[name$=_p]', template, 20, 0.1, 1);
            },
            "change .pid-p"      : function (e, template) {
                change('input[name$=_p]', template, 0, 20, 1);
            },

            "click .js-btn-i-dec": function (e, template) {
                dec('input[name$=_i]', template, 0, 0.001, 3);
            },
            "click .js-btn-i-inc": function (e, template) {
                inc('input[name$=_i]', template, 0.250, 0.001, 3);
            },
            "change .pid-i"      : function (e, template) {
                change('input[name$=_i]', template, 0, 0.250, 3);
            },

            "click .js-btn-d-dec": function (e, template) {
                dec('input[name$=_d]', template, 0, 1, 0);
            },
            "click .js-btn-d-inc": function (e, template) {
                inc('input[name$=_d]', template, 100, 1, 0);
            },
            "change .pid-d"      : function (e, template) {
                change('input[name$=_d]', template, 0, 100, 0);
            }
        });

    inc = function (selector, template, max, step, round) {
        var input, value;

        input = $(template.find(selector));

        value = parseFloat(input.val()) + step;
        if (value > max) {
            value = max;
        }

        input.val(value.toFixed(round));
    };

    dec = function (selector, template, min, step, round) {
        var input, value;

        input = $(template.find(selector));

        value = parseFloat(input.val()) - step;
        if (value < min) {
            value = min;
        }

        input.val(value.toFixed(round));
    };

    change = function (selector, template, min, max, round) {
        var input, value;

        input = $(template.find(selector));

        value = parseFloat(input.val());
        if (value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }

        input.val(value.toFixed(round));
    };
}(jQuery));