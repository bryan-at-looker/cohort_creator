import React, {Component, Suspense} from 'react'
import ReactDOM from 'react-dom';
import { api31Call, getCohortSpace, getFile } from './helpers';
import { Router, Route } from "react-router-dom";
import CohortMenu from './components/CohortMenu';
import "semantic-ui-css/semantic.min.css";
import {  Grid } from 'semantic-ui-react';
import './index.css';
import {find, filter, isEmpty, isEqual, uniq} from 'lodash';
import history from './history'
import {MergeCohorts} from './components/pages/MergeCohorts.js'


const APPLICATION_FILE = 'cohort_builder.json'
const PROJECT = 'reviews'

const Explore = React.lazy(() => import('./components/pages/Explore.js'))
const Dashboard = React.lazy(() => import('./components/pages/Dashboard.js'))
// const MergeCohorts = React.lazy(() => import('./components/pages/MergeCohorts.js'))

const STORAGE_KEYS = ['selected_explore', 'changeable_menu_item','cohort_field_name','cohort_type'];

let polling_flag = false;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      changeable_menu_item: 'create',
      selected: {},
      reload: false,
      queries: [],
      running_cohorts: [],
      cohort_notifications: [],
      finished_cohorts: [],
      cohort_type: '',
      previous_selected_look: ''
    };
    STORAGE_KEYS.forEach(key => {
      if (key != 'selected_explore') {
        this.state[key] = localStorage.getItem(key);
      }
    })
  }

  run_cohort = async (look) => {
    look = awaitapi31Call('GET',`/looks/${look}`)
  }

  queryResults = async () => {
    var {queries, running_cohorts, cohort_notifications, finished_cohorts} = this.state
    while (polling_flag === true) {
      queries = this.state.queries
      var finished = []
      var not_finished = []

      var completed_tasks = filter(queries, {_completed: true}).map(q=>{return q})
      var not_completed_tasks = filter(queries, {_completed: false}).map(q=>{return q})

      if ( completed_tasks.length > 0) {
        var task_results = completed_tasks.map(t=>{
          return api31Call('GET',`/query_tasks/${t.id}/results`)
        })
        var new_results = await Promise.all(task_results)
        new_results.forEach((r,i)=> {
          var q = find(queries, {id: completed_tasks[i].id})
          if (r && r.length === 1) {
            finished.push(q._look_id)
          } else {
            not_finished.push(q._look_id)
          }
        })
  
        running_cohorts = this.state.running_cohorts
        cohort_notifications = this.state.cohort_notifications
        finished_cohorts = this.state.finished_cohorts
        queries = this.state.queries

        var state_set = {}
        if ((!isEqual(not_completed_tasks,queries) && not_completed_tasks.length > 0 ) || finished.length > 0 || not_finished.length > 0) {
          state_set['queries'] = not_completed_tasks
        }
        
        if (finished.length > 0) {
          state_set['running_cohorts'] = filter(running_cohorts, (o)=>{ return finished.indexOf(o) === -1 })
          state_set['finished_cohorts'] = finished.concat(finished_cohorts)
          state_set['cohort_notifications'] = uniq(cohort_notifications.concat(finished))
        }

        this.setState(state_set, ()=>{
          if (state_set.queries && state_set.queries.length === 0 && not_finished.length===0) {
            polling_flag = false
          }
        })
      }

      await pause(`queryresults- polling: ${polling_flag}`)
    }
    
  }

  checkQueries = async () => {
    var {queries} = this.state
    while (polling_flag === true) {
      queries = this.state.queries
      var new_queries = []
      var outstanding_tasks = filter(queries, {_completed: false}).map(q=>{return q.id})
      if (outstanding_tasks.length > 0) {
        
        var multi_tasks = await api31Call('GET','/query_tasks/multi_results',`query_task_ids=${outstanding_tasks.join(',')}`)
        Object.keys(multi_tasks).forEach(t=> {
          var q = find(queries,{id: t})
          if (multi_tasks[t].status === 'complete') {
            q['_completed'] = true
            new_queries.push(q)
          } else if (multi_tasks[t].status === 'error') {
            // TODO HOW TO HANDLE ERRORS?
          } else {
            new_queries.push(q)
          }    
        })
      } else {
        new_queries = queries
      }

      // this.setState({queries: new_queries})
      await pause('checkqueries')
    }
  }

  beginPolling = async () => {
    
    var {running_cohorts, queries} = this.state
    this.checkQueries();
    this.queryResults();
    while (polling_flag === true) {
      queries = this.state.queries
      var run_tasks = running_cohorts.map((id)=>{
        var q_check = find(queries, {_look_id: id})
        return query_runner(q_check,id)
      })
      var fin_tasks = await Promise.all(run_tasks)
      fin_tasks = filter(fin_tasks, (o)=>{return !isEmpty(o)})
      if (fin_tasks.length > 0) {
        this.setState({queries: fin_tasks.concat(this.state.queries)}, async ()=>{ 
          await pause('beginpolling: added tasks')
        })
      } else {
        await pause('beginpolling')
      }
    }
  }
  
  componentWillMount() {

    // setTimeout(()=>{this.setState({
    //   running_cohorts: [1,5],
    //   cohort_notifications: [1,5]
    // })},5000)

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
    // api31Call('GET',`/connections/snowlooker`)
  }

  updateContent = async (type) => {
    var [personal_space, shared_space] = await Promise.all([api31Call('GET',`/spaces/${this.state.space_id}/${type}`), api31Call('GET',`/spaces/${this.state.app_file.shared_folder_id}/${type}`)])
    this.updateApp({ [type]: filter(personal_space.concat(shared_space),{deleted: false}) });
  }

  componentDidUpdate (pprops, pstate) {
    const {props, state} = this

    if (state.running_cohorts && pstate.running_cohorts && !isEqual(state.running_cohorts,pstate.running_cohorts)) {
      if (pstate.running_cohorts.length === 0 && state.running_cohorts.length > 0 && polling_flag===false) {
        polling_flag = true;
        this.beginPolling()
      } else if (pstate.running_cohorts.length > 0 && state.running_cohorts.length === 0) {
        // this.setState({polling: false})
      }
    }

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
    const {selected_explore, selected_look, looks, app_file, running_cohorts, 
      cohort_notifications, finished_cohorts, changeable_menu_item, 
      cohort_field_name, qid, cohort_type, previous_selected_look} = this.state

    const notifications = { 
      running_cohorts: running_cohorts, 
      cohort_notifications: cohort_notifications,
      finished_cohorts: finished_cohorts
    }
    

    const webhook_url = (app_file && app_file.webhook_url) ? app_file.webhook_url : ''
    
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
      look_qid: (selected_look_metadata && selected_look_metadata.query) ? selected_look_metadata.query.client_id : '',
      changeable_menu_item: changeable_menu_item,
      cohort_field_name: cohort_field_name,
      cohort_type: cohort_type,
      previous_look: previous_selected_look
    }
    return (
      <div>
        <Router basename={'/applications/'+window.lookerMetadata.app.id} history={history}>
          <Grid style={{height: '100vh'}}>
            <Grid.Column stretched width={2} style={{height: '100vh', paddingRight: '0px'}}>
              <CohortMenu
                webhook_url={webhook_url}
                notifications={notifications}
                qid={qid}
                space_id={this.state.space_id}
                fns={fns}
                looks={looks}
                selected={selected}
                explores={this.state.explores}
              ></CohortMenu>
            </Grid.Column>
            <Grid.Column stretched width={14} style={{height: '100vh', paddingLeft: '0px'}}>
              <Suspense fallback={<div>Loading...</div>}>
                <Route exact path='/' 
                  render={() => <Explore 
                    fns={fns} 
                    selected={selected}
                    reload={this.state.reload}
                    />}  
                />
                <Route 
                  exact path="/create" 
                  render={() => <Explore 
                    fns={fns} 
                    selected={selected}
                    reload={this.state.reload}
                    />}  
                />
                <Route path='/cohort_dashboard' 
                  render={() => <Dashboard 
                    fns={fns} 
                    selected={selected}
                    reload={this.state.reload}
                    />}  
                />
                <Route path='/compare_two' 
                  render={() => <Dashboard 
                    fns={fns} 
                    selected={selected}
                    reload={this.state.reload}
                    />}  
                />
                <Route path='/merge_cohorts' 
                  render={() => <MergeCohorts 
                    fns={fns} 
                    selected={selected}
                    reload={this.state.reload}
                    looks={looks}
                    />}  
                />
               </Suspense>
            </Grid.Column>
          </Grid>
        </Router>
      </div>
      )
    }
  }
  window.addEventListener('load', () => {
    ReactDOM.render( <App />, document.getElementById('app-container'));
  }, false); 
  

  function pause(id) {
    return new Promise(resolve => setTimeout(() => {
      resolve();
    }, 10000)); 
  }

  function query_runner(q_check, id) {
    return new Promise ( async (resolve,reject) => {
      if (!q_check) {
        var look = await api31Call('GET',`/looks/${id}`)
        const description = JSON.parse(look.description)
        var query = await api31Call('POST','/queries','', {
          model: look.query.model,
          view: look.query.view,
          filters: Object.assign(look.query.filters, { [`${description.view}_latest.cohort_id`]: `${id}` }),
          filter_expression: look.query.filter_expression,
          dynamic_fields: look.query.dynamic_fields,
          fields: [`${description.view}_latest.cohort_id`]
        })
        var query_task = await api31Call('POST','/query_tasks', 'cache=false', {
          query_id: query.id,
          result_format: 'json'
        })
        query_task['_look_id'] = id
        query_task['_completed'] = false
        resolve(query_task)
      } else {
        resolve({})
      }
    })
  }