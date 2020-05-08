import React, {Component} from 'react';
import { Menu, Dropdown, Input, Icon, Label, Message } from 'semantic-ui-react';
import { api31Call} from '../helpers';
import { find, filter } from 'lodash'

import ExploreDropdown from './ExploreDropdown';
import CohortList from './CohortList';
import ChangeableMenuItem from './ChangeableMenuItem';
import history from '../history';

const CHANGEABLE_MENU = [
  {key: 'create', text: 'Create Cohorts', value: 'create'},
  {key: 'cohort_dashboard', text: 'Cohort Dashboard', value: 'cohort_dashboard'},
  {key: 'compare_two', text: 'Compare Two Cohorts', value: 'compare_two'},
  {key: 'merge_cohorts', text: 'Merge Cohorts', value: 'merge_cohorts'},
]

export default class CreateCohort extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changeable_menu_item: 'create'
    };
  }

  componentWillMount() {}
  componentDidMount() {}

  dropDownChange = (event, data) => {
    this.setState({[data.id]: data.value})
    if (data.id === 'changeable_menu_item') {
      history.push(`/${data.value}`)
      this.props.fns.updateApp({ 
        changeable_menu_item: data.value, 
        selected_look: '',
        previous_selected_look: '',
      })
    } else if (data.id === 'cohort_field_name') {
      this.props.fns.updateApp({cohort_field_name: data.value})
    }
  }
  
  render() {
    const {selected, looks, qid, fns} = this.props
    const {cohort_type} = this.state

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
              id='cohort_field_name'
              size='mini'
              options={lookup_fields}
              value={selected.cohort_field_name}
              onChange={this.dropDownChange}
              placeholder='Select a cohort field'
              ></Dropdown>
          </Menu.Item>
          <Menu.Item>
            <Dropdown
              search selection fluid
              id='changeable_menu_item'
              size='mini'
              options={CHANGEABLE_MENU}
              value={selected.changeable_menu_item}
              onChange={this.dropDownChange}
              placeholder='Function Selection'
              ></Dropdown>
          </Menu.Item>
        </Menu.Menu>
        <ChangeableMenuItem
          webhook_url={this.props.webhook_url}
          notifications={this.props.notifications}
          space_id={this.props.space_id}
          selected={selected}
          fns={fns}
          qid={qid}
          looks={looks}
        ></ChangeableMenuItem>
        <CohortList
            fns={fns}
            looks={looks}  
            selected={selected}
            qid={qid}
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