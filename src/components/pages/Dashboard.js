import React, {Component} from 'react';
import './css/Explore.css'
import {find, sortBy, uniq} from 'lodash'

const FRAME_ID='looker-dashboard'
const INSTANCE=window.location.origin
const TYPE = 'dashboard'
const CSS = ``

export default class ExploreFrame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dashboard_load_complete: false
    }
  }
  
  handleMessages = (event) => {
    const {dashboard_load_complete} = this.state
    if(document.getElementById(FRAME_ID) && document.getElementById(FRAME_ID).contentWindow) {
      if (event.source === document.getElementById(FRAME_ID).contentWindow) {
        if (event.origin === INSTANCE) {
          const data = JSON.parse(event.data)
          if (data) {
            // console.log({type: data.type, data: data})
            // if (!dashboard_load_complete && data.type) {
            //   this.setState({dashboard_load_complete: true})
            // }
          }
        }
      }
    }
  }
	
  componentWillMount() {window.addEventListener("message", this.handleMessages  )}

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessages, false);
    this.setState({dashboard_load_complete: false})
  }
  
  handleLoad = () => {
    var doc  = document.getElementById(FRAME_ID).contentDocument || document.getElementById(FRAME_ID).contentWindow.document 
    const style = doc.createElement('style');
    style.id = "testbfw3";
    style.type = 'text/css';
    style.appendChild(doc.createTextNode(CSS))
    doc.getElementsByTagName('head')[0].appendChild(style);
  }

  updateCohortFilter = (looks) => {
    const {changeable_menu_item} = this.props.selected
    var req = {
      type: 'dashboard:filters:update',
      filters: {}
    }
    if (changeable_menu_item === 'cohort_dashboard') {
      req.filters['Cohort ID'] = looks[0]
      postLooker(req);
      setTimeout(()=>{postLooker({type: 'dashboard:run'})},750)
    } else if (changeable_menu_item === 'compare_two') {
      looks = sortBy(looks)
      req.filters['Cohort A'] =  looks[0]
      req.filters['Cohort B'] =  looks[1]
      postLooker(req);
      if (looks.length === 2) {
        setTimeout(()=>{
          postLooker({type: 'dashboard:run'})
        },750)
      }
    }
  }
	
  componentDidMount() {}

  componentDidUpdate(pprops, pstate) {
    const sel = this.props.selected
    const psel = pprops.selected
    const {dashboard_load_complete} = this.state
    const pdashboard_load_complete = pstate.dashboard_load_complete
    var looks = []
    if (sel && sel.look && sel.look.length > 0 ) { looks.push(sel.look) }
    if (sel && sel.previous_look && sel.previous_look.length > 0 ) { looks.push(sel.previous_look) }
    if (looks.length > 0) {
      this.updateCohortFilter(looks)
    }
  }
  
  render() {
    const {selected} = this.props
    var cohort_join = {}
    if (selected && selected.explore_metadata && selected.explore_metadata._cohort_joins) {
      cohort_join = find(selected.explore_metadata._cohort_joins, {cohort_dimension: selected.cohort_field_name})
    }
    var dashboard = ''
    if (cohort_join && selected && selected.changeable_menu_item && selected.changeable_menu_item ) {
      dashboard = cohort_join[selected.changeable_menu_item]
    }
    
    var url = ''
    if (dashboard && dashboard.length > 0) {
      url = `/embed/dashboards/${dashboard}?embed_domain=${INSTANCE}`
    }
    
    return (
			<>
				<iframe 
					src={url}
          id={FRAME_ID}
          onLoad={this.handleLoad}
				/>
			</>
    )
  }
}

function postLooker (message) {
  var my_iframe = document.getElementById(FRAME_ID);
  my_iframe.contentWindow.postMessage(JSON.stringify(message), INSTANCE);
}