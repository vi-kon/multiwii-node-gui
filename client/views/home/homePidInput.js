var homePidInputHelpers, homePidInputEvents;

function inc(selector, template, max, step, round) {
    var input, value;

    input = $(template.find(selector));

    value = parseFloat(input.val()) + step;
    if (value > max) {
        value = max;
    }

    input.val(value.toFixed(round));
}

function dec(selector, template, min, step, round) {
    var input, value;

    input = $(template.find(selector));

    value = parseFloat(input.val()) - step;
    if (value < min) {
        value = min;
    }

    input.val(value.toFixed(round));
}

function change(selector, template, min, max, round) {
    var input, value;

    input = $(template.find(selector));

    value = parseFloat(input.val());
    if (value < min) {
        value = min;
    } else if (value > max) {
        value = max;
    }

    input.val(value.toFixed(round));
}

homePidInputHelpers = {};

homePidInputHelpers.mspPidSettingP = function (type) {
    if (Session.get('mspPid') === undefined) {
        return (0).toFixed(1);
    }
    return (Session.get('mspPid')[type].p / 10).toFixed(1);
};

homePidInputHelpers.mspPidSettingI = function (type) {
    if (Session.get('mspPid') === undefined) {
        return (0).toFixed(3);
    }
    return (Session.get('mspPid')[type].i / 1000).toFixed(3);
};

homePidInputHelpers.mspPidSettingD = function (type) {
    if (Session.get('mspPid') === undefined) {
        return 0;
    }
    return Session.get('mspPid')[type].d;
};

homePidInputEvents = {};

homePidInputEvents['click .js-btn-p-dec'] = function (e, template) {
    dec('input[name$=_p]', template, 0, 0.1, 1);
};

homePidInputEvents['click .js-btn-p-inc'] = function (e, template) {
    inc('input[name$=_p]', template, 20, 0.1, 1);
};

homePidInputEvents['change .pid-p'] = function (e, template) {
    change('input[name$=_p]', template, 0, 20, 1);
};

homePidInputEvents['click .js-btn-i-dec'] = function (e, template) {
    dec('input[name$=_i]', template, 0, 0.001, 3);
};

homePidInputEvents['click .js-btn-i-inc'] = function (e, template) {
    inc('input[name$=_i]', template, 0.250, 0.001, 3);
};

homePidInputEvents['change .pid-i'] = function (e, template) {
    change('input[name$=_i]', template, 0, 0.250, 3);
};

homePidInputEvents['click .js-btn-d-dec'] = function (e, template) {
    dec('input[name$=_d]', template, 0, 1, 0);
};

homePidInputEvents['click .js-btn-d-inc'] = function (e, template) {
    inc('input[name$=_d]', template, 100, 1, 0);
};

homePidInputEvents['change .pid-d'] = function (e, template) {
    change('input[name$=_d]', template, 0, 100, 0);
};

Template.homePidInput.helpers(homePidInputHelpers);
Template.homePidInput.events(homePidInputEvents);
