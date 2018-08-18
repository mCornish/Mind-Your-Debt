import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Login extends Component {
    static propTypes = {
        url: PropTypes.string
    }

    render() {
        return (
            <a role="button" href={this.props.url}>Sign In To YNAB</a>
        );
    }
}

export default Login