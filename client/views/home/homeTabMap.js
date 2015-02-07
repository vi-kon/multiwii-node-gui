var homeEvents, homeTabMapHelpers, tabActive, tabInitialized;

tabInitialized = false;

homeEvents = {};

homeEvents['shown.bs.tab a[data-toggle="tab"]'] = function (e) {
    if ($(e.target).attr('href') !== '#tab-map') {
        tabActive = false;
    } else {
        tabActive = true;

        if (!tabInitialized) {
            GoogleMaps.init(
                {
                    sensor: true,
                    key   : 'AIzaSyDHwhetNXRrkFRT7Ifg3bic0IFHjpA8ZGc'
                },
                function () {
                    var map, mapOptions, marker;

                    mapOptions = {
                        zoom     : 18,
                        mapTypeId: google.maps.MapTypeId.SATELLITE,
                        center   : {
                            lat: Session.get('mspData').rawGps.coord.latitude / 10000000,
                            lng: Session.get('mspData').rawGps.coord.longitude / 10000000
                        }
                    };

                    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

                    marker = new google.maps.Marker({
                                                        map  : map,
                                                        title: 'Actual Position'
                                                    });

                    Tracker.autorun(function () {
                        if (tabActive) {
                            marker.setPosition({
                                                   lat: Session.get('mspData').rawGps.coord.latitude / 10000000,
                                                   lng: Session.get('mspData').rawGps.coord.longitude / 10000000
                                               });
                        }
                    });
                }
            );

            tabInitialized = true;
        }
    }
};

homeTabMapHelpers = {};

homeTabMapHelpers.mspGpsLatitude = function () {
    return Session.get('mspData').rawGps.coord.latitude;
};

homeTabMapHelpers.mspGpsLongitude = function () {
    return Session.get('mspData').rawGps.coord.longitude;
};

homeTabMapHelpers.mspGpsAltitude = function () {
    return Session.get('mspData').rawGps.coord.altitude;
};

Template.home.events(homeEvents);
Template.homeTabMap.helpers(homeTabMapHelpers);
