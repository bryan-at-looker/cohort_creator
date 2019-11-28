import React, {Component} from 'react';
import './css/Explore.css'

const DEFAULT_THEME='arielle_test'
const FRAME_ID='looker-explore'
const INSTANCE=window.location.origin
const TYPE = 'explore'
const DATETIME = 'order_items.created_date'
const MEASURE = 'order_items.total_sale_price'
const CSS = `
#lk-embed-container > lk-explore-dataflux > lk-explore-header > div.title-controls > div.explore-header-menu.ng-scope.dropdown { display: none; }
#lk-embed-container > lk-explore-dataflux > lk-explore-header > div.title-controls > lk-space-nav > div { display: none; }
`

export default class ExploreFrame extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
	}
	
  handleMessages = (event) => {
    if(document.getElementById(FRAME_ID) && document.getElementById(FRAME_ID).contentWindow) {
      if (event.source === document.getElementById(FRAME_ID).contentWindow) {
        if (event.origin === INSTANCE) {
          const data = JSON.parse(event.data)
          if (data) {
            // console.log({type: data.type, data: data})
            if (data.explore) {
              let qid = (new URL(data.explore.absoluteUrl ) ).searchParams.get('qid')
              if (qid) { this.props.fns.updateApp({qid: qid}) }
            }
          }
        }
      }
    }
  }
	
  componentWillMount() {window.addEventListener("message", this.handleMessages  )}

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessages, false);
  }
  
  handleLoad = () => {
    var doc  = document.getElementById(FRAME_ID).contentDocument || document.getElementById(FRAME_ID).contentWindow.document 
    const style = doc.createElement('style');
    style.id = "testbfw3";
    style.type = 'text/css';
    style.appendChild(doc.createTextNode(CSS))
    doc.getElementsByTagName('head')[0].appendChild(style);
  }
	
  componentDidMount() {}

  componentDidUpdate(pprops, pstate) {
    if (!pprops.reload && this.props.reload) {
      document.getElementById(FRAME_ID).contentWindow.location = this.generateUrl();
      this.props.fns.updateApp({reload: false})
    }
  }

  generateUrl = () => {
    const {selected} = this.props
    var url = ''
    if (selected && selected.explore) {
      url = `/embed/${TYPE}/${selected.explore.split('::')[0]}/${selected.explore.split('::')[1]}?embed_domain=${INSTANCE}`;
      if (selected.look_qid != '') {
        url = url + `&qid=${selected.look_qid}`;
      } else {
        if (selected.explore_metadata._default_fields && selected.explore_metadata._default_fields.length > 0) {
          url = url + `&fields=${selected.explore_metadata._default_fields.join(',')}`
        }
        if (selected.explore_metadata._default_filters && Object.keys(selected.explore_metadata._default_filters).length > 0) {
          const filters = Object.keys(selected.explore_metadata._default_filters).map(fil=>{ return `&f[${fil}]=${selected.explore_metadata._default_filters[fil]}`})
          url = url + filters
        }
      } 
    }
    return url
  }
  
  render() {
    var url = this.generateUrl();
    
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