import React, {Component} from 'react';
import {Message} from 'semantic-ui-react'

export default class Notifications extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentWillMount() {}
  componentDidMount() {}

  dismiss = (event,data) => {
    const {notifications} = this.props
    this.props.fns.updateApp({
      cohort_notifications: notifications.cohort_notifications.filter(v => v !== data.id),
      finished_cohorts: notifications.finished_cohorts.filter(v => v !== data.id)
    })
  }
  
  render() {
    // console.log(this.props.notifications)
    const {cohort_notifications, finished_cohorts} = this.props.notifications
    const messages = cohort_notifications.map(id=>{
      var message = (finished_cohorts.indexOf(id)>-1) ? `Finished Cohort ID: ${id}` : `Running Cohort ID: ${id}`
      var color = (finished_cohorts.indexOf(id)>-1) ? 'green' : 'yellow'
      return <Message
        key={id}
        id={id}
        onDismiss={this.dismiss}
        size='mini'
        color={color}
        >{message}
      </Message>
    })
    return (
      <>
        {messages}
      </>
    )
  }
}