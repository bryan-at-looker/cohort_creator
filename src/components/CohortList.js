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
    this.props.fns.updateApp({
      selected_look: data.id.toString(),
      reload: true
    })
  }

  createMenuList = () => {
    const {looks, selected} = this.props
    
    const filtered_looks = filter(looks, (o) => {
      var description = {}
      try {
        var description = JSON.parse(o.description)
      } catch {
        console.log('look description could not be parsed')
      }
      return ( (`${o.query.model}::${o.query.view}`)== selected.explore ) && 
              description && 
              description.type==this.props.cohort_type &&
              description.field==this.props.cohort_field_name
    })
    
    return (orderBy(filtered_looks, [lk => lk.title.toLowerCase()], ['asc'])).map(lk => {
      return  <Popup 
        key={lk.id}
        content={`Cohort ID: ${lk.id}`} 
        trigger={
          <Menu.Item
            id={lk.id}
            active={lk.query.client_id==this.props.qid}
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