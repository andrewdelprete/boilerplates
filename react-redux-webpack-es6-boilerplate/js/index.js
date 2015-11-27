import '../scss/app.scss'

import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';

// React Redux Provider component
import { Provider } from 'react-redux'

// Reducers
import reducer from './reducers'

// Store
import { createStore } from './stores'
let store = createStore(reducer)

// App Container
import App from './containers/App'

var renderDevTools = () => {
    if (__DEV__) {
        let { DevTools, DebugPanel, LogMonitor } = require('redux-devtools/lib/react');
        return (
            <DebugPanel top right bottom>
                <DevTools store={ store } monitor={ LogMonitor } />
            </DebugPanel>
        )
    }
}

ReactDOM.render(
    <div>
        <Provider store={ store }>
            <App />
        </Provider>

        { renderDevTools() }
    </div>,
    document.getElementById('App')
);
