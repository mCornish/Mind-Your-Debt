import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Collapsable extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    closeText: PropTypes.string,
    open: PropTypes.bool,
    openText: PropTypes.string
  }

  static defaultProps = {
    closeText: 'Hide',
    open: true,
    openText: 'Show'
  }

  state = {
    open: this.props.open
  }

  render() {
    return (
      <div className="Collapsable">
        <button onClick={this.toggleOpen}>
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