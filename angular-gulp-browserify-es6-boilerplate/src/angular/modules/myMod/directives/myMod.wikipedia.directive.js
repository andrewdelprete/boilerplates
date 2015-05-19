'use strict';

var directive = function() {

    var ctrlFunc = ['myMod.wikipedia.service', function(Wiki) {
        /**
         * Submit Functionality
         * @return { Array }
         */
        this.search = () => {
            // Disable submit during search to avoid multiple requests
            this.disableSubmit = true;

            // Use our service to search for term
            Wiki.search(this.term).then((response) => {
                this.results = response.data[1];
                this.disableSubmit = false;
            });
        };
    }];

    // var linkFunc = (scope, iElement, iAttrs) => {};

    return {
        restrict: 'A',
        // link: linkFunc,
        controller: ctrlFunc,
        controllerAs: 'ctrl',
        template: require('../views/myMod.wikipedia.directive.html'),
        scope: true
    };
};

export default directive;