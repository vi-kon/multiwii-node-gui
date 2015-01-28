notify = function (text, type) {
    noty({
             layout   : 'topRight',
             theme    : 'relax',
             type     : type === undefined ? 'alert' : type,
             text     : text,
             animation: {
                 open : 'animated fadeInRight',
                 close: 'animated fadeOutRight'
             },
             timeout  : 5000
         });
};