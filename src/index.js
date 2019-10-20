import React, {Component, Suspense} from 'react'
import ReactDOM from 'react-dom';
import { api31Call, getCohortSpace, getFile } from './helpers';
import { BrowserRouter, Route } from "react-router-dom";
import CohortMenu from './components/CohortMenu';
import "semantic-ui-css/semantic.min.css";
import {  Grid } from 'semantic-ui-react';
import './index.css';
import {find, filter} from 'lodash';

const APPLICATION_FILE = 'cohort_builder.json'
const PROJECT = 'reviews'

const Explore = React.lazy(() => import('./components/pages/Explore.js'))
const Admin = React.lazy(() => import('./components/pages/admin.js'))

const STORAGE_KEYS = ['selected_look', 'selected_explore'];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      selected: {},
      reload: false
    };
    STORAGE_KEYS.forEach(key => {
      if (key != 'selected_explore') {
        this.state[key] = localStorage.getItem(key);
      }
    })
  }
  
  componentWillMount() {
    getCohortSpace()
    .then(space_id => {
      getFile(PROJECT,APPLICATION_FILE)
      .then ( (file) => {
        const content = JSON.parse(file.contents)
        var explores = Object.keys(content.explores).map(m_e => {
          return api31Call('GET',`/lookml_models/${m_e.split('::')[0]}/explores/${m_e.split('::')[1]}`)
        })
        Promise.all(explores)
        .then(explores => {
          const first_explore = localStorage.getItem('selected_explore') || explores[0].id
          this.updateApp({
            app_file: content,
            explores: explores,
            selected_explore: first_explore,
            space_id: space_id
          })
        })
      })
    })
    api31Call('GET',`/connections/snowlooker`)
  }

  updateContent = async (type) => {
    var [personal_space, shared_space] = await Promise.all([api31Call('GET',`/spaces/${this.state.space_id}/${type}`), api31Call('GET',`/spaces/${this.state.app_file.shared_folder_id}/${type}`)])
    this.updateApp({ [type]: personal_space.concat(shared_space) });
  }

  componentDidUpdate (pprops, pstate) {
    const {props, state} = this

    // if the explore selected changes, repopulate the cohort list
    if (  (!pstate.selected_explore) || 
          (state.selected_explore &&  pstate.selected_explore && state.selected_explore != pstate.selected_explore)
        ) {
      this.updateContent('looks')
    }
  }

  updateApp = (object) => { 
    Object.keys(object).forEach(key => {
      if (STORAGE_KEYS.indexOf(key) > -1 ) {
        localStorage.setItem(key, object[key]);
      }
    })
    this.setState(object)
  }
  
  render() {
    const fns = {updateContent: this.updateContent, updateApp: this.updateApp }
    const {selected_explore, selected_look, looks} = this.state
    
    var selected_look_metadata = {};
    var selected_explore_metadata = {};

    if (looks && looks.length > 0) {
      selected_look_metadata = find(looks, (lk) => { return lk.id.toString() == selected_look})
    }
    if (this.state.selected_explore && this.state.explores && this.state.explores.length > 0) {
      var app_file_explore = this.state.app_file.explores[selected_explore]
      selected_explore_metadata = find(this.state.explores, (ex) => { return ex.id == selected_explore})

      // we will use data points from the .json application, adding them into the selected explore
      // TODO theoritically these should never be empty, perhaps perform checks on appfile load
      selected_explore_metadata['_default_fields'] = app_file_explore.default_fields || []
      selected_explore_metadata['_default_filters'] = app_file_explore.default_filters || {}
      selected_explore_metadata['_cohort_joins'] = app_file_explore.cohort_joins || {}
      
    }

    // create a standard selected object to pass through as props
    const selected = {
      explore: selected_explore,
      explore_metadata: selected_explore_metadata,
      look: selected_look,
      look_metadata: selected_look_metadata,
      look_qid: (selected_look_metadata && selected_look_metadata.query) ? selected_look_metadata.query.client_id : ''
    }
    return (
      <div>
        <BrowserRouter basename={'/applications/'+window.lookerMetadata.app.id}>
          <Grid style={{height: '100vh'}}>
            <Grid.Column stretched width={2} style={{height: '100vh', paddingRight: '0px'}}>
              <CohortMenu
                 qid={this.state.qid}
                 space_id={this.state.space_id}
                 fns={fns}
                 looks={looks}
                 selected={selected}
                 explores={this.state.explores}
              ></CohortMenu>
            </Grid.Column>
            <Grid.Column stretched width={14} style={{height: '100vh', paddingLeft: '0px'}}>
              <Suspense fallback={<div>Loading...</div>}>
                <Route exact path='/' render={() => <Explore 
                  fns={fns} 
                  selected={selected}
                  reload={this.state.reload}
                  />}  
                />
                <Route exact path="/explore" component={Explore} />
                <Route path="/admin" component={Admin} />
               </Suspense>
            </Grid.Column>
          </Grid>
        </BrowserRouter>
      </div>
      )
    }
  }
  window.addEventListener('load', () => {
    ReactDOM.render( <App />, document.getElementById('app-container'));
  }, false); 
  