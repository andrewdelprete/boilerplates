import React from 'react';
import Immutable from 'immutable';

class IncrementByField extends React.Component {
    render() {
        const { incrementBy, actions } = this.props

        return (
            <div>
                <h3><b>IncrementByField</b> Component</h3>
                <input type="number"
                       ref="incrementBy"
                       onChange={ this._setIncrementBy.bind(this) }
                       defaultValue={ incrementBy }
                       className="w33"
                />
            </div>
        );
    }

    _setIncrementBy() {
        const { actions } = this.props
        const n = parseInt(this.refs.incrementBy.value)

        if (!isNaN(n)) {
            actions.setIncrementBy(n)
        }
    }
}

IncrementByField.propTypes = {
    incrementBy: React.PropTypes.number.isRequired,
    actions: React.PropTypes.object.isRequired
};

export default IncrementByField
