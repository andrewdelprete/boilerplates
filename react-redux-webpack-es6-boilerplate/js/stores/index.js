// Redux utility functions
import { compose, createStore, applyMiddleware } from 'redux';

// Redux DevTools store enhancers
import { devTools, persistState } from 'redux-devtools';

// Redux Thunk middleware
import thunk from 'redux-thunk'

// Reducers
import reducer from '../reducers'

const finalCreateStore = compose(
    // Enables your middleware:
    applyMiddleware(thunk), // any Redux middleware, e.g. redux-thunk
    // Provides support for DevTools:
    devTools(),
    // Lets you write ?debug_session=<name> in address bar to persist debug sessions
    persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
)(createStore);

export default finalCreateStore(reducer);
