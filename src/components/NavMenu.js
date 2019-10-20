import React, {Component} from 'react';
import {Menu} from 'semantic-ui-react'

export default class NavMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentWillMount() {}
  componentDidMount() {}
  
  render() {
    return (
      <>
        <Menu fixed='bottom' pointing secondary>
          <Menu.Item>
            Create
          </Menu.Item>
          <Menu.Item>
            Dashboard Template 1
          </Menu.Item>
        </Menu>
      </>
    )
  }
}