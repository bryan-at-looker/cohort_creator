import React, {Component, Fragment} from 'react';
import { Modal, Menu, Message, Button, Header, Dropdown } from 'semantic-ui-react';
import { find } from 'lodash';
import { getSQL, api31Call } from '../helpers';

export default class SnapshotCohorts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cohort_dimension: '',
      new_query: '',
      running: false,
      finished: false,
      finished_rows: 0
    }
  }

  componentWillMount() {}
  componentDidMount() {}

  executeSql = async (sql_text, look_query) => {
    this.setState({running: true})
    var create_query = await api31Call('POST','/sql_queries','',{
      model_name: look_query.model,
      sql: sql_text
    })
    var run_sql = await api31Call('POST',`/sql_queries/${create_query.slug}/run/json`,'',{})
    this.setState({ running: false, finished: true, finished_rows: (run_sql && run_sql[0] && run_sql[0].update_count) ? run_sql[0].update_count : 0})
  }

  handleChange = async (event,data) => { 
    const {query} = this.props.selected.look_metadata
    this.setState({
      cohort_dimension: data.value,
      cohort_join: find(this.props.selected.explore_metadata._cohort_joins, o=>{return o.cohort_dimension==data.value})
    }) 
    var new_query = await getSQL({
      model: query.model,
      view: query.view,
      filters: query.filters,
      filter_expression: query.filter_expression,
      fields: [data.value]
    })
    this.setState({new_query: new_query})
  }

  render() {
    const {selected} = this.props
    const {cohort_join, new_query, running, finished, finished_rows} = this.state
    const look_query = (selected && selected.look_metadata && selected.look_metadata.query) ? selected.look_metadata.query : {}
    const information_complete = (!(
      new_query && cohort_join && cohort_join.view && look_query
    ))
    const sql_text = ( information_complete ) ? '--- select a field to create some SQL' : `
INSERT INTO $\{${this.state.cohort_join.view}.SQL_TABLE_NAME} 
  (join_key,cohort_id,looker_user_id,created_at)
(
  SELECT * FROM (
    ${new_query}
  )
  CROSS JOIN ( 
    SELECT 
      ${selected.look} as cohort_id
    , {{ _user_attributes['id'] | replace: '.0', '' }} as looker_user_id
    , getdate() as created_at 
  ) as extras
)
`


    var dims = [];
    var lookup_fields = [];

    if ( selected && selected.explore_metadata && selected.explore_metadata.fields ) {
      dims = selected.explore_metadata.fields['dimensions'].concat(selected.explore_metadata.fields['measures'])
      lookup_fields = selected.explore_metadata._cohort_joins.map(join => {
        return find(dims, (o)=> { return join.cohort_dimension == o.name })
      })
    }
    
    return (
      <>
        <Menu.Item>
          <Modal
            trigger={
              <Button 
                disabled={!(look_query && look_query.client_id && look_query.client_id==this.props.qid)} 
                fluid size='mini'>Create Snapshot
              </Button>
            }
            closeIcon
            centered={false}
          >
            <Modal.Header>Create a cohort Snapshot</Modal.Header>
            <Modal.Content>
              Select a Cohort Dimension
              <Dropdown 
                selection 
                options={lookup_fields.map((f,i)=>{ return { key: f.name, value: f.name, text: f.label_short || f.label}})}
                valie={this.state.cohort_dimension}
                onChange={this.handleChange}
              >

              </Dropdown>
            </Modal.Content>
            <Modal.Description>
            <Message style={{whiteSpace: 'pre-wrap'}}>
                {sql_text}
              </Message>
            </Modal.Description>
            {/* <Modal.Footer> */}
              <Modal.Actions>
              {(running || finished) && <Message 
                style={{textAlign: 'left'}} color={(running) ? 'yellow' : 'green'}>
                {(running) ? `Your cohort is currently being persisted. It can be filtered by Cohort ID: ${selected.look}` : `Your load is finished! You can now filter by Cohort ID: ${selected.look} with ${fnum(finished_rows)} rows`}
              </Message> }
                <Button 
                  positive
                  disabled={information_complete || running}
                  onClick={() => this.executeSql(sql_text,look_query)}
                >Submit</Button>
                <Button
                  disabled={information_complete}
                >Delete All</Button>
              </Modal.Actions>
            {/* </Modal.Footer> */}

          </Modal>
        </Menu.Item>   
      </>
    )
  }
}

function fnum(x) {
	if(isNaN(x)) return x;

	if(x < 9999) {
		return x;
	}

	if(x < 1000000) {
		return Math.round(x/1000) + "K";
	}
	if( x < 10000000) {
		return (x/1000000).toFixed(2) + "M";
	}

	if(x < 1000000000) {
		return Math.round((x/1000000)) + "M";
	}

	if(x < 1000000000000) {
		return Math.round((x/1000000000)) + "B";
	}

	return "1T+";
}