import React from 'react';
import Immutable from 'immutable';
import { MyComponent } from './components';

const data = Immutable.fromJS({ title: "My Component" });

React.render(<MyComponent data={ data } />, document.getElementById('app'));


