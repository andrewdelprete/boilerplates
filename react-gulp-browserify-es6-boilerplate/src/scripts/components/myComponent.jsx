import React from 'react';

class MyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            title: props.title
        }
    }

    render() {
        return (
            <div>
                <h1>{ this.state.title }</h1>
            </div>
        );
    }
}


export default MyComponent;