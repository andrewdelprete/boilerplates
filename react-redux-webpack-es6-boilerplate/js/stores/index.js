import { createStore as initialCreateStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

export let createStore = applyMiddleware(thunk)(initialCreateStore)

if (__DEV__) {
    let { devTools, persistState } = require('redux-devtools')
    let { compose } = require('redux')

    createStore = compose(
        // Enables your middleware:
        applyMiddleware(thunk), // any Redux middleware, e.g. redux-thunk
        // Provides support for DevTools:
        devTools(),
        // Lets you write ?debug_session=<name> in address bar to persist debug sessions
        persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
    )(initialCreateStore)
}
