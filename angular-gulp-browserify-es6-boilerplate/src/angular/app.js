'use strict';

/**
 * Angular Mods
 */
import 'angular';
import 'angular-ui-router';

/**
 * My Custom Mods
 */
import './modules/myMod';


/**
 * Instantiate our main Angular module 'app'
 */
var app = angular.module('app', [ 'app.myMod', 'ui.router' ]);

/**
 * Our Routes
 * Example of routes, multiple views, attaching a controller, and requiring and hardcoding view templates.
 * The last route shows the template hardcoded instead.
 */
app.config(($stateProvider, $urlRouterProvider) => {
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('index', {
            url: '/',
            views: {
                'viewA': {
                    template: require('./views/index.viewA.html'),
                    // Attach a controller
                    controller: 'myMod.ctrl as ctrl'
                },
                'viewB': { template: require('./views/index.viewB.html') }
            }
        })
        .state('route1', {
            url: '/route1',
            views: {
                'viewA': { template: require('./views/route1.viewA.html') },
                'viewB': { template: require('./views/route1.viewB.html') }
            }
        })
        .state('route2', {
            url: '/route2',
            views: {
                'viewA': { template: require('./views/route2.viewA.html') },
                // Hard code view template.
                'viewB': { template: '<h1>route2.viewB.html</h1>' }
            }
        });
});

