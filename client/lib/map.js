/**
 * Create new map
 *
 * @param {string} id canvas DOM id
 *
 * @property {object} map
 * @property {object} markerHome
 * @property {object} markerMulticopter
 */
createMap = function (id) {
    var self, geoLocateHome, geoLocateCopter;
    self = this;
    geoLocateHome = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                self.map.setCenter({
                                       lat: position.coords.latitude,
                                       lng: position.coords.longitude
                                   });
                self.markerHome.setPosition({
                                                lat: position.coords.latitude,
                                                lng: position.coords.longitude
                                            });
            });
        }
    };

    GoogleMaps.init(
        {
            sensor: true,
            key   : 'AIzaSyDHwhetNXRrkFRT7Ifg3bic0IFHjpA8ZGc'
        },
        function () {
            var mapOptions, multicopterIcon;

            mapOptions = {
                zoom             : 18,
                mapTypeId        : google.maps.MapTypeId.SATELLITE,
                disableDefaultUI : true,
                scrollwheel      : true,
                keyboardShortcuts: false
            };

            self.map = new google.maps.Map(document.getElementById(id), mapOptions);

            multicopterIcon = {
                path: 'M133.717,94.198c-10.341-10.11-26.688-10.793-37.859-2.057l-7.523-7.351V60.819l9.661-9.442c11.035,7.094,26.018,5.9,35.73-3.583c11.105-10.848,11.105-28.45-0.009-39.304c-11.104-10.849-29.115-10.849-40.229,0c-10.583,10.34-11.071,26.806-1.473,37.729l-9.938,9.709H58.794l-7.822-7.643c8.764-10.904,8.01-26.739-2.282-36.79c-11.104-10.849-29.115-10.849-40.228,0C-2.642,22.345-2.642,39.942,8.472,50.8c10.01,9.779,25.631,10.738,36.753,2.886l7.748,7.569V84.36l-7.386,7.216C34.458,83.44,18.6,84.312,8.472,94.198c-11.114,10.85-11.114,28.447,0,39.306c11.112,10.848,29.124,10.848,40.238,0c10.165-9.939,11.01-25.54,2.535-36.437l7.858-7.68H81.77l8.617,8.419c-7.873,10.847-6.842,25.973,3.111,35.697c11.112,10.848,29.124,10.848,40.238,0C144.831,122.654,144.831,105.057,133.717,94.198z M96.516,11.439c9.438-9.215,24.746-9.22,34.184,0c9.437,9.22,9.437,24.188,0,33.407c-8.94,8.73-23.141,9.18-32.637,1.366l-2.885-2.813C87.12,34.122,87.555,20.194,96.516,11.439z M11.49,47.852c-9.437-9.221-9.437-24.188,0-33.408c9.437-9.215,24.746-9.22,34.183,0c9.437,9.219,9.437,24.187,0,33.408C36.236,57.067,20.926,57.071,11.49,47.852z M45.681,130.555c-9.445,9.21-24.755,9.221-34.182,0c-9.446-9.219-9.446-24.187,0-33.407c9.427-9.22,24.737-9.22,34.182,0C55.109,106.368,55.109,121.336,45.681,130.555z M130.708,130.555c-9.446,9.21-24.755,9.221-34.184,0c-9.445-9.219-9.445-24.187,0-33.407c9.429-9.22,24.737-9.22,34.184,0C140.136,106.368,140.136,121.336,130.708,130.555z'
                           + 'M32.748,34.156l16.661-0.003v-6.016H32.736c-0.151-0.201-0.301-0.402-0.486-0.584c-0.185-0.181-0.39-0.327-0.594-0.475V10.807l-6.151-0.01l-0.003,16.278c-0.206,0.148-0.413,0.295-0.599,0.477c-0.186,0.182-0.336,0.384-0.487,0.584H7.753l-0.01,6.024l16.681-0.003c0.149,0.197,0.296,0.396,0.479,0.574c0.186,0.182,0.392,0.33,0.598,0.479l-0.003,16.287h6.16V35.222c0.207-0.149,0.415-0.297,0.603-0.479C32.445,34.561,32.596,34.358,32.748,34.156z'
                           + 'M109.929,31.728c0.187,0.182,0.393,0.33,0.599,0.479l-0.004,16.287h6.159V32.217c0.207-0.149,0.416-0.297,0.604-0.48c0.187-0.182,0.336-0.384,0.488-0.585l16.661-0.004v-6.014h-16.673c-0.151-0.201-0.301-0.403-0.485-0.584c-0.185-0.181-0.391-0.327-0.595-0.475V7.802l-6.15-0.009l-0.004,16.278c-0.206,0.148-0.413,0.295-0.6,0.478c-0.186,0.182-0.336,0.384-0.487,0.584H92.78l-0.011,6.024l16.681-0.004C109.6,31.351,109.746,31.549,109.929,31.728z'
                           + 'M32.25,110.262c-0.185-0.182-0.39-0.329-0.594-0.478V93.507h-6.151v16.281c-0.204,0.147-0.409,0.293-0.594,0.474c-0.186,0.181-0.336,0.382-0.488,0.581H7.762l-0.019,6.027l16.69-0.008c0.149,0.195,0.296,0.393,0.478,0.569c0.185,0.182,0.39,0.328,0.594,0.477v16.298h6.151v-16.268c0.211-0.151,0.422-0.302,0.613-0.487c0.187-0.185,0.338-0.389,0.491-0.593l16.657-0.008v-6.008H32.736C32.585,110.644,32.436,110.442,32.25,110.262z'
                           + 'M117.764,110.843c-0.152-0.199-0.301-0.4-0.486-0.581c-0.185-0.183-0.391-0.33-0.595-0.479V93.507h-6.15v16.28c-0.204,0.147-0.409,0.294-0.595,0.475s-0.336,0.382-0.487,0.581H92.789l-0.02,6.027l16.69-0.008c0.149,0.195,0.296,0.393,0.478,0.569c0.186,0.182,0.391,0.328,0.595,0.477v16.298h6.15v-16.268c0.212-0.15,0.423-0.302,0.614-0.487c0.187-0.185,0.339-0.389,0.49-0.593l16.657-0.008v-6.008H117.764z',
                fillColor  : 'yellow',
                fillOpacity: 0.8,
                scale      : 0.8
            };

            self.markerHome = new google.maps.Marker({
                                                         map  : self.map,
                                                         title: 'Home Position'
                                                     });

            self.markerMulticopter = new google.maps.Marker({
                                                                map  : self.map,
                                                                title: 'Multicopter Position',
                                                                icon : multicopterIcon
                                                            });

            geoLocateHome();

            var btnGroup = $('<div class="btn-group"/>')
                .append($('<div class="btn btn-sm btn-default"/>')
                            .append($('<i class="icon-io-location"></i>'))
                            .append(' Center Home')
                            .click(geoLocateHome))
                .append($('<div class="btn btn-sm btn-default"/>')
                            .append($('<i class="icon-io-quad"></i>'))
                            .append(' Center Copter')
                            .click(geoLocateCopter))
                .append($('<div class="btn btn-sm btn-default"/>')
                            .append($('<i class="icon-io-compass"></i>'))
                            .append(' Track Copter'))
                .css({
                         marginTop : '5px',
                         marginLeft: '5px',
                         zIndex    : 1
                     })[0];
            console.log(btnGroup);


            self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(btnGroup);

        }
    );
};