/**
 * Show notification message
 *
 * @param {string} text - message
 * @param {string} type - message type [success, error]
 * @global
 */
notify = function (text, type) {
    noty({
        layout   : 'topCenter',
        theme    : 'relax',
        type     : type === undefined ? 'alert' : type,
        text     : text,
        animation: {
            open : 'animated fadeInDown',
            close: 'animated fadeOutUp'
        },
        timeout  : 2000
    });
};