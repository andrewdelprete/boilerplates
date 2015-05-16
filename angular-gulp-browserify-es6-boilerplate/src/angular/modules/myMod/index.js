'use strict';

import 'angular';
import { myModCtrl } from './controllers';

var myMod = angular.module('app.myMod', [])
    .config(() => {
        console.log('myMod: Loaded!');
    });

// Controllers
myMod.controller('myMod.ctrl', myModCtrl);

// Directives - Coming Soon
// myMod.directive('', );

// Services - Coming Soon
// myMod.service('', );

export default myMod;