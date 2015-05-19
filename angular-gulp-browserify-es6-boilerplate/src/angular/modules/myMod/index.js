'use strict';

import 'angular';
import { myModCtrl } from './controllers';
import { myModWikipediaService } from './services';
import { myModWikipediaDirective } from './directives';

var myMod = angular.module('app.myMod', [])
    .config(() => {
        console.log('myMod: Loaded!');
    });

// Controllers
myMod.controller('myMod.ctrl', myModCtrl);

// Directives - Coming Soon
myMod.directive('mymodWikipedia', myModWikipediaDirective);

// Services
myMod.service('myMod.wikipedia.service', myModWikipediaService);

export default myMod;