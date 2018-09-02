import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Login.css';

class Login extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    text: PropTypes.string,
    url: PropTypes.string
  }

  static defaultProps = {
    disabled: false
  }

  render() {
    return (
      <div className="Login">
        {this.props.text && (
          <p className="Login__text">{this.props.text}</p>
        )}
        <button
          className="Login__button"
          onClick={this.authenticate}
          disabled={this.props.disabled}
        >Sign In To YNAB</button>
      </div>
    );
  }

  authenticate = () => {
    if (this.props.url) window.location.href = this.props.url;
  }
}

export default Login