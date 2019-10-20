import React, {Component} from 'react';
import { Menu, Dropdown, Input, Icon, Label, Message } from 'semantic-ui-react';
import { api31Call, getSQL, sqlText, fnum} from '../helpers';
import { find, filter } from 'lodash'

import ExploreDropdown from './ExploreDropdown';
import CohortList from './CohortList';

const TYPES = ['Static','Dynamic']
const STORAGE_KEYS = ['cohort_field_name','cohort_type']

export default class CreateCohort extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      running: false,
      icon: 'plus',
      running: false,
      finished: false,
      message_showing: false,
      running_look: ''
    };
    STORAGE_KEYS.forEach(key => {
      this.state[key] = localStorage.getItem(key);
    })
  }

  componentWillMount() {}
  componentDidMount() {}

  handleChange = (event, data) => {    
    this.setState({title: data.value}) 
  }

  saveCohort = async () => {
    this.setState({running: true, running_look: this.props.selected.look, message_showing: true})
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
        type: this.state.cohort_type,
        field: this.state.cohort_field_name,
        view: find(this.props.selected.explore_metadata._cohort_joins, {'cohort_dimension': this.state.cohort_field_name})['view']
      })
    })
    this.props.fns.updateApp({selected_look: look.id.toString()})
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
      setTimeout( () => { this.setState({icon: 'plus'})}, 3000)
    });
    
  }

  dropDownChange = (event, data) => {
    if (STORAGE_KEYS.indexOf(data.id) > -1 ) {
      localStorage.setItem(data.id, data.value);
    }
    this.setState({[data.id]: data.value})
  }

  clearMessage = (event,data) => {
    this.setState({running: false, finished: false, message_showing: false, finished_rows: false, running_look: ''})
  }
  
  render() {
    const {qid,selected} = this.props
    const {cohort_type, cohort_field_name, running, finished, finished_rows, running_look, message_showing} = this.state

    var lookup_fields = []
    if (selected.explore_metadata.fields) {
      lookup_fields = cohortFields(selected)
    }

    return (
      <>
        <Menu.Menu>
          <Menu.Item>
          <ExploreDropdown 
            explores={this.props.explores}
            selected={this.props.selected}
            fns={this.props.fns}
          >            
        </ExploreDropdown>
          </Menu.Item>
          <Menu.Item>
          <Dropdown
            search selection fluid
            id='cohort_type'
            size='mini'
            options={TYPES.map(i => { return {key: i, text: i, value: i}})}
            value={cohort_type}
            onChange={this.dropDownChange}
            placeholder='Select a Type'
            ></Dropdown>
          </Menu.Item>
          <Menu.Item>
          <Dropdown
            search selection fluid
            id='cohort_field_name'
            size='mini'
            options={lookup_fields}
            value={cohort_field_name}
            onChange={this.dropDownChange}
            placeholder='Select a cohort field'
            ></Dropdown>
          </Menu.Item>
          <Menu.Item>
            <Input     
              size='mini'
              action={{ 
                icon: this.state.icon, 
                className: (this.state.running && this.props.qid) ? 'loading': '', 
                onClick: this.saveCohort, 
                disabled: (this.state.title === '' || !qid || (qid && qid == '')) 
              }}
              labelPosition='left'
              onChange={this.handleChange}
              value={this.state.title}
            >
            </Input>
          </Menu.Item>
          {(message_showing) && <Message 
            onDismiss={this.clearMessage}
            style={{textAlign: 'left'}} color={(running) ? 'yellow' : 'green'}>
            {(!finished) ? `Your cohort is currently being persisted. It can be filtered by Cohort ID: ${running_look}` : `Your load is finished! You can now filter by Cohort ID: ${running_look} with ${fnum(finished_rows)} rows`}
          </Message> }
        </Menu.Menu>
        <CohortList
            fns={this.props.fns}
            looks={this.props.looks}  
            selected={this.props.selected}
            qid={this.props.qid}
            cohort_type={this.state.cohort_type}
            cohort_field_name={this.state.cohort_field_name}
          ></CohortList>
      </>
    )
  }
}

function cohortFields (selected) {
  var dims = [];
  var lookup_fields = [];

  if ( selected && selected.explore_metadata && selected.explore_metadata.fields ) {
    dims = selected.explore_metadata.fields['dimensions'].concat(selected.explore_metadata.fields['measures'])
    lookup_fields = selected.explore_metadata._cohort_joins.map(join => {
      const lookup = find(dims, (o)=> { return join.cohort_dimension == o.name });
      if (lookup) {
        return lookup;
      } else {
        console.error(`Could not find ${join.cohort_dimension} in ${selected.explore}`)
      }
    })
    return filter(lookup_fields,'name').map(i => { return (i && i.name) ? {key: i.name, text: i.label_short || i.label, value: i.name} : {} })
  } else {
    return lookup_fields
  }
}