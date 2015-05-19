'use strict';

var service = function($http) {

    /**
     * Search Wikipedia for specified term
     * @param  { String }
     * @return { Promise }
     */
    this.search = (term) => {
        return $http.jsonp('http://en.wikipedia.org/w/api.php?&search=' + term.toLowerCase() + '&action=opensearch&format=json&callback=JSON_CALLBACK');
    };
};

export default service;