'use strict';

import Riot from 'riot';
import '../tags/peoplelist.tag';
import '../tags/peoplecount.tag';
import PeoplelistObservable from '../mixins/peoplelistObservable.js';

var params = {
    people: [
        { name: 'Peter', age: 20 },
        { name: 'James', age: 30 },
        { name: 'John', age: 40 },
        { name: 'Andrew', age: 50 },
        { name: 'Judas', age: 61 }
    ]
};

Riot.mixin('peoplelistObservable', new PeoplelistObservable() );
Riot.mount('peoplelist', params);
Riot.mount('peoplecount');
