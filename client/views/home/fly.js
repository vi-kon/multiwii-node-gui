var homeTab, map, tabActive, tabInitialized;

tabActive = false;
tabInitialized = false;

homeTab = {};

homeTab['shown.bs.tab a[data-toggle="tab"]'] = function (e) {
    if ($(e.target).attr('href') !== '#tab-fly') {
        tabActive = false;
    } else {
        tabActive = true;

        if (!tabInitialized) {
            map = createMap('map-canvas-fly');

            tabInitialized = true;
        }
    }
};

Template.home.events(homeTab);