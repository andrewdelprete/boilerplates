import '../scss/app.scss'

import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';

// React components for Redux DevTools
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';

// React Redux Provider component
import { Provider } from 'react-redux'

// Store
import store from './stores'

// App Container
import App from './containers/App'

ReactDOM.render(
    <div>
        <Provider store={ store }>
            <App />
        </Provider>
        <DebugPanel top right bottom>
            <DevTools store={ store } monitor={ LogMonitor } />
        </DebugPanel>
    </div>,
    document.getElementById('App')
);
