import React from 'react';
import Immutable from 'immutable';

class Counter extends React.Component {
    componentDidMount() {
        const { actions } = this.props
        actions.incrementAsync()
    }

    render() {
        const { counter, actions } = this.props

        return (
            <div>
                <h3><b>Counter</b> Component (async button)</h3>
                <button onClick={ actions.incrementAsync }>{ counter }</button>
            </div>
        );
    }
}

Counter.propTypes = {
    counter: React.PropTypes.number.isRequired,
    actions: React.PropTypes.object.isRequired
};

export default Counter
