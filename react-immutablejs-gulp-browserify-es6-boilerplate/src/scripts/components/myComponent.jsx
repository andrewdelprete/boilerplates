import React from 'react';
import Immutable from 'immutable';

const propTypes = {
    data: React.PropTypes.instanceOf(Immutable.Map).isRequired,
};

class MyComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        const title  = !Immutable.is(this.props.data.get('title'), nextProps.data.get('title'));
        const shouldUpdate = (title);
        return shouldUpdate;
    }

    render() {
        const data = this.props.data;

        return (
            <h1>{ data.get('title') }</h1>
        );
    }
}

MyComponent.propTypes = propTypes;
export default MyComponent;