import angular from 'angular';
import myMod from './modules/myMod';

/**
 * Our main Angular module 'app'
 */
angular.module('app', [ myMod.name ]);