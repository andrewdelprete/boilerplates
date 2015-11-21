import React from 'react';
import Immutable from 'immutable';

class StateTable extends React.Component {
    render() {
        const { incrementBy, counter, clickCount } = this.props

        return (
            <div>
                <h3><b>StateTable</b> Component</h3>
                <table className="w33">
                    <thead>
                        <tr>
                            <td>counter:</td>
                            <td>incrementBy:</td>
                            <td>clickCount:</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{ counter }</td>
                            <td>{ incrementBy }</td>
                            <td>{ clickCount }</td>
                        </tr>
                    </tbody>
                </table>
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

StateTable.propTypes = {
    counter: React.PropTypes.number.isRequired,
    incrementBy: React.PropTypes.number.isRequired,
    clickCount: React.PropTypes.number.isRequired,
};

export default StateTable
