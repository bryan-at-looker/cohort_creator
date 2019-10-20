import React, {Component} from 'react';
import { Dropdown, Menu } from 'semantic-ui-react';
import { orderBy } from 'lodash';

export default class ExploreDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentWillMount() {}
  componentDidMount() {}

  handleSelect = (event, data) => {
    this.props.fns.updateApp({selected_explore: data.value, selected_look: ''})
  }
  
  render() {
    var {explores, selected} = this.props
    var list = []
    var group_list = []
    var selected_explore = (selected && selected.explore) ? selected.explore : ''
    
    if (explores && explores.length > 0) {
      // order by group label and by label
      explores = orderBy(explores, [ex => ex.group_label.toLowerCase(),ex => ex.label.toLowerCase()], ['asc','asc'])
      explores.forEach(ex=>{

        // create an array of just group_labels
        if( group_list.indexOf(ex.group_label.toLowerCase())) { 
          group_list.push(ex.group_label.toLowerCase())
          list.push({
            key: ex.group_label.toLowerCase(),
            disabled: true,
            text: ex.group_label,
            id: ex.group_label.toLowerCase()
          })
        }        
        list.push( {
          key: ex.id,
          text: ex.label,
          value: ex.id,
        })
      })
    }
    
    return (
      <>
          <Dropdown
            search selection fluid
            size='mini'
            options={list}
            value={selected_explore}
            onChange={this.handleSelect}
          ></Dropdown>       
      </>
    )
  }
}