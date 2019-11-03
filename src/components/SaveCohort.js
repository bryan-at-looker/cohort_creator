import React, {Component} from 'react';
import {Input, Dropdown, Menu} from 'semantic-ui-react'
import { find, findIndex } from 'lodash'
import { api31Call} from '../helpers';

const TYPES = ['Static','Dynamic']

export default class SaveCohort extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      icon: 'plus'
    }
  }

  componentWillMount() {}
  componentDidMount() {}

  handleChange = (event, data) => {    
    this.setState({title: data.value}) 
  }

  saveCohort = async () => {
    this.setState({running: true})
    var query = await api31Call('GET',`/queries/slug/${this.props.qid}`);
    var new_query = await api31Call('POST','/queries','',{
      model: query.model,
      view: query.view,
      fields: this.props.selected.explore_metadata._default_fields,
      filters: query.filters,
      filter_expression: query.filter_expression,
      dynamic_fields: query.dynamic_fields,
      limit: query.limit
    })
    var look =  await api31Call('POST','/looks','', {
      query_id: new_query.id,
      space_id: this.props.space_id,
      title: this.state.title,
      description: JSON.stringify({
        type: this.props.selected.cohort_type,
        field: this.props.selected.cohort_field_name,
        view: find(this.props.selected.explore_metadata._cohort_joins, {'cohort_dimension': this.props.selected.cohort_field_name})['view']
      })
    })
    const look_id = look.id.toString()
    this.props.fns.updateApp({
      selected_look: look_id,
      running_cohorts: this.props.notifications.running_cohorts.concat([look_id]),
      cohort_notifications: this.props.notifications.cohort_notifications.concat([look_id])
    })
    api31Call('POST','/scheduled_plans/run_once','',{
      name: `Cohorts - Run ${look.id}`,
      look_id: look.id,
      require_no_results: false,
      require_results: false,
      require_change: false,
      scheduled_plan_destination: [
        {
          format: 'json',
          address: this.props.webhook_url,
          type: 'webhook'
        }
      ]
    })
    this.setState({
      title: ''
    }, () => {
      this.props.fns.updateContent('looks');
      setTimeout( () => { 
        this.setState({icon: 'check', running: false}, () => {
          setTimeout( () => { this.setState({icon: 'plus'})}, 3000)
        })
      }, 3000)
    });
  }


  dropDownChange = (event, data) => {
    this.props.fns.updateApp({[data.id]: data.value})
  }
  
  render() {
    const {title, running, icon} = this.state
    const {qid, looks, selected} = this.props
    const input_error = (findIndex(looks, {title: title} ) > -1)
    return (
      <>
        <Menu.Item>
          Create Options
        </Menu.Item>
        <Menu.Menu>
          <Menu.Item>
            <Dropdown
              search selection fluid
              id='cohort_type'
              size='mini'
              options={TYPES.map(i => { return {key: i, text: i, value: i}})}
              value={selected.cohort_type}
              onChange={this.dropDownChange}
              placeholder='Select a Type'
            ></Dropdown>
          </Menu.Item>
          <Menu.Item>
            <Input     
              error={input_error}
              size='mini'
              action={{ 
                icon: icon, 
                className: (running && qid) ? 'loading': '', 
                onClick: this.saveCohort, 
                disabled: (title === '' || !qid || (qid && qid == '') || input_error || selected.cohort_type.length == 0) 
              }}
              labelPosition='left'
              onChange={this.handleChange}
              value={title}
            >
            </Input>
          </Menu.Item>
        </Menu.Menu>
      </>
    )
  }
}