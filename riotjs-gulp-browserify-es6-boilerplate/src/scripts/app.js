'use strict';

import Riot from 'riot';
import '../tags/helloworld.tag';

// Riot.tag('helloworld',
//     `<h1>
//         { title }
//     </h1>`,
//
//     function(opts) {
//         this.title = `${ opts.title } World!`;
//     }
// );

Riot.mount('helloworld');
