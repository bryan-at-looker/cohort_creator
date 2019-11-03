import React, {Component} from 'react';
import {Input} from 'semantic-ui-react'
import SaveCohort from './SaveCohort';

export default class ChangeableMenuItem extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentWillMount() {}
  componentDidMount() {}
  
  render() {
    const {selected} = this.props
    if (selected.changeable_menu_item == 'create') {
      return (
        <>
          <SaveCohort
            webhook_url={this.props.webhook_url}
            notifications={this.props.notifications}
            selected={this.props.selected}
            fns={this.props.fns}
            qid={this.props.qid}
            looks={this.props.looks}
            space_id={this.props.space_id}
          ></SaveCohort>
        </>
      )
    } else {
      return <></>
    }

  }
}