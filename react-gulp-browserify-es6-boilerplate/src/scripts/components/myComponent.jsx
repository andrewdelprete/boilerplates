import React from 'react';

class MyComponent extends React.Component {
    render() {
        return (
            <div>
                <h1>{ this.props.title }</h1>
            </div>
        );
    }
}

MyComponent.propTypes = {
    title: React.PropTypes.string
}

export default MyComponent
