import '../scss/app.scss'

import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';

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
    </div>,
    document.getElementById('App')
);
