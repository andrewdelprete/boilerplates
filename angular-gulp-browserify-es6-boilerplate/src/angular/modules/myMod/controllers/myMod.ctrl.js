'use strict';

var ctrl = ['myMod.wikipedia.service', function(Wiki) {
    this.results = undefined;

    // Use our service to search for term
    // // @TODO - Add a directive to search instead of hardcoding term
    Wiki.search('airplane').then((response) => {
        this.results = response.data[1];
    });
}];

export default ctrl;