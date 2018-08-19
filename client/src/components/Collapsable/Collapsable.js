import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Collapsable.css';

class Collapsable extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
    closeText: PropTypes.string,
    isHidden: PropTypes.bool,
    open: PropTypes.bool,
    openText: PropTypes.string
  }

  static defaultProps = {
    closeText: 'Hide',
    isHidden: false,
    open: true,
    openText: 'Show'
  }

  state = {
    open: this.props.open
  }

  render() {
    return (
      <div className="Collapsable">
        <button onClick={this.toggleOpen} className={this.props.isHidden ? 'is-hidden' : null}>
          {this.state.open ? this.props.closeText : this.props.openText}
        </button>
        {this.state.open && this.props.children}
      </div>
    )
  }

  toggleOpen = () => {
    this.setState({ open: !this.state.open });
  }
}

export default Collapsable