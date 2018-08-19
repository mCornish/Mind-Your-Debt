import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Login.css';

class Login extends Component {
  static propTypes = {
    text: PropTypes.string,
    url: PropTypes.string
  }

  render() {
    return (
      <div className="Login">
        {this.props.text && (
          <p className="Login__text">{this.props.text}</p>
        )}
        <a
          role="button"
          className="Login__button"
          href={this.props.url
        }>Sign In To YNAB</a>
      </div>
    );
  }
}

export default Login