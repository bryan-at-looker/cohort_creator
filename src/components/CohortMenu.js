import React, {Component} from 'react';
import {Menu} from 'semantic-ui-react'
import CreateCohort from './CreateCohort';
import Notifications from './Notifications';

const INSTANCE=window.location.origin

export default class CohortMenu extends Component {
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
        <Menu vertical fluid>
        <Menu.Item>
          Cohort Builder
          <Menu.Menu>

          </Menu.Menu>
        </Menu.Item>
        <CreateCohort
          notifications={this.props.notifications}
          webhook_url={this.props.webhook_url}
          explores={this.props.explores}
          fns={this.props.fns}
          qid={this.props.qid}
          space_id={this.props.space_id}
          selected={this.props.selected}
          looks={this.props.looks}  
        ></CreateCohort>
        <Menu.Item>
          Jump to
          
          <Menu.Menu>
            
            <Menu.Item 
              as='a'
              target='_blank'
              href={`${INSTANCE}/spaces/${this.props.space_id}`}
            >Edit in Personal Space</Menu.Item>
            <Menu.Item 
              as='a'
              target='_blank'
              href={`${INSTANCE}/explore/x/${this.props.qid}`}
            >Open the Explore</Menu.Item>
          </Menu.Menu>
          </Menu.Item>
          <Menu.Item>
            <Notifications
              fns={this.props.fns}
              notifications={this.props.notifications}
            ></Notifications>
          </Menu.Item>          
        </Menu>            
      </>
    )
  }
}