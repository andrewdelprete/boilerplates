import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import { MyComponent } from './components';

const data = Immutable.fromJS({ title: "My Component" });

ReactDOM.render(<MyComponent data={ data } />, document.getElementById('app'));
