'use strict';

import Riot from 'riot';
import '../tags/helloworld.tag';

var params = {
    people: [
        { name: 'Peter' },
        { name: 'James' },
        { name: 'John' },
        { name: 'Andrew' }
    ]
};

Riot.mount('helloworld', params);
