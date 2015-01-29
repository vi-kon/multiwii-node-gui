(function () {
    "use strict";

    var tabActive, mapTabInitialized;

    Template.homeTabMap.helpers(
        {
            mspGpsLatitude : function () {
                return Session.get('mspActualData').rawGPS.coord.latitude / 10000000;
            },
            mspGpsLongitude: function () {
                return Session.get('mspActualData').rawGPS.coord.longitude / 10000000;
            },
            mspGpsAltitude : function () {
                return Session.get('mspActualData').rawGPS.coord.altitude;
            }
        });

    Template.home.events(
        {
            'shown.bs.tab a[data-toggle="tab"]': function (e) {
                if ($(e.target).attr('href') === '#tab-map') {
                    if (!mapTabInitialized) {
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
                                        lat: Session.get('mspActualData').rawGPS.coord.latitude / 10000000,
                                        lng: Session.get('mspActualData').rawGPS.coord.longitude / 10000000
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
                                                               lat: Session.get('mspActualData').rawGPS.coord.latitude / 10000000,
                                                               lng: Session.get('mspActualData').rawGPS.coord.longitude / 10000000
                                                           });
                                    }
                                });
                            }
                        );

                        mapTabInitialized = true;
                    }
                    tabActive = true;
                } else {
                    tabActive = false;
                }
            }
        });

    mapTabInitialized = false;
}());