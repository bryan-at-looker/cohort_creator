import React, {Component} from 'react';
import { Menu, Popup } from 'semantic-ui-react';
import {orderBy, filter} from 'lodash'


export default class CohortList extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentWillMount() {}
  componentDidMount() {}

  handleClick = (event, data) => {
    const clicked_look = data.id.toString();
    if (clicked_look !== this.props.selected.look) {
      this.props.fns.updateApp({
        selected_look: clicked_look,
        previous_selected_look: this.props.selected.look,
        reload: true
      })
    }
  }

  createMenuList = () => {
    const {looks, selected, qid} = this.props
    
    const filtered_looks = filter(looks, (o) => {
      var description = {}
      try {
        description = JSON.parse(o.description)
      } catch {
      }
      return ( (`${o.query.model}::${o.query.view}`)== selected.explore ) && 
              description &&
              description.field==this.props.selected.cohort_field_name
    })
    
    return (orderBy(filtered_looks, [lk => lk.title.toLowerCase()], ['asc'])).map(lk => {
        return  <Popup 
        key={lk.id}
        position='right center'
        content={`Cohort ID: ${lk.id}`} 
        trigger={
          <Menu.Item
            draggable="true"
            id={lk.id}
            active={determineActive(lk.id, selected, qid, lk.query.client_id)}
            onClick={this.handleClick}
          >
           { lk.space.is_personal_descendant && <i>{lk.title}</i>}
           { !lk.space.is_personal_descendant && <b>{lk.title}</b>}
          </Menu.Item>
        } 
      />
    })
  }
  
  render() {
    const {looks} = this.props
    // console.log(looks)
    var menu_items = (looks && looks.length > 0) ? this.createMenuList() : <></>
    return (
      <>
        <Menu.Item>
          Cohorts
        </Menu.Item>
        <Menu.Menu>
          {menu_items}
        </Menu.Menu>
      </>
    )
  }
}

function determineActive(look_id, selected, qid, look_qid) {
  look_id = look_id.toString();
  if (selected.changeable_menu_item === 'compare_two') {

    return ([selected.look, selected.previous_look].indexOf(look_id) > -1)

  } else if (selected.changeable_menu_item === 'create') {

    return (selected.look == look_id && qid === look_qid)

  } else if (selected.changeable_menu_item === 'cohort_dashboard') {

    return (look_id === selected.look)

  } else {
    return false
  }
}