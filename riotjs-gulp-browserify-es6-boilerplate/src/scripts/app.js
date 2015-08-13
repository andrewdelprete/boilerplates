'use strict';

import Riot from 'riot';
import '../tags/riotpedia.tag';

var wikipedia = Riot.observable();

wikipedia.search = function(term) {
    $.ajax({
        'url': 'http://en.wikipedia.org/w/api.php',
        'jsonp': 'callback',
        'dataType': 'jsonp',
        'data': {
            search: term.toLowerCase(),
            action: 'opensearch',
            format: 'json'
        },
        'success': (response) => {
            wikipedia.trigger('search', response);
        }
    });
};

Riot.mount('riotpedia', wikipedia);
