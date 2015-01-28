Router.configure({
                     layoutTemplate: 'layout'
                 });

Router.route('/', function () {
    this.render('home');
});

Router.route('api', function () {
    //this.render('');
});