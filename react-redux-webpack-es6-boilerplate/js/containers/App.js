import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Counter from '../components/Counter';
import IncrementByField from '../components/IncrementByField';
import StateTable from '../components/StateTable';

import * as actions from '../actions/actions';

class App extends React.Component {
    render() {
        return (
            <div className="wrap">
                <Counter { ...this.props } />
                <hr />
                <IncrementByField { ...this.props } />
                <hr />
                <StateTable { ...this.props } />
            </div>
        );
    }
}

// Which props do we want to inject, given the global state?
// Note: use https://github.com/faassen/reselect for better performance.
function mapStateToProps(state) {
    return {
        counter: state.counter,
        incrementBy: state.incrementBy,
        clickCount: state.clickCount,
    }
}

// Maps Action Creators to a property called 'actions'
function mapDispatchToProps(dispatch) {
    return {
        /**
         * Turns an object whose values are action creators, into
         * an object with the same keys, but with every action wrapped
         * into a dispatch call so they may be invoked directly.
         *
         * IOW: Now we can use our actions anywhere they're
         * passed and it will still dispatch to the store.
         *
         * http://rackt.org/redux/docs/api/bindActionCreators.html
         */
        actions: bindActionCreators(actions, dispatch)
    }
}

// Wrap the component to inject dispatch and state into it
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App)
