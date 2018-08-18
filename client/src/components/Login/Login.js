import React, { Component } from 'react';
class Login extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <a role="button" href={this.props.url}>Sign In To YNAB</a>
        );
    }
}

export default Login