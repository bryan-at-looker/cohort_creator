import React, {useEffect, useState} from 'react'
import { Label, Button, Segment, Icon, Grid, Input, Loader } from "semantic-ui-react";
import {find, keyBy, findIndex} from 'lodash'
import {onDragStart, getSqlCountFromSql} from '../../helpers'


import "semantic-ui-css/semantic.min.css"
import { api31Call, api31CallSqlText } from '../../helpers';
import { TypeAheadText } from './TypeAheadText';
import { MergeCohortSteps } from './MergeCohortSteps';
import { RunningTasks } from './RunningTasks';

const OPERATORS = {
  '+': '+',
  '-': '-',
  '∩': '∩',
  '(': '(',
  ')': ')'
}

export function MergeCohorts({...props}) {
  const [expression_count, setExpressionCount] = useState('');
  const [sql_obj, setSqlObj] = useState({})
  const [sql_slug, setSqlSlug] = useState(undefined)
  const [string, setString] = useState([])
  const [look_title, setLookTitle] = useState('')
  const [explore_ok, setExploreOk] = useState(undefined)
  const [downloadJson, setDownloadJson] = useState(undefined)
  const [calculate_loader, setCalculateLoader] = useState(false)
  const [look_loader, setLookLoader] = useState(false)
  const [sql_explore_metadata,setSqlExploreMetadata] = useState(undefined)
  const [show_sql,setShowSql] = useState(false)
  const [tasks, setTasks] = useState([])
  const [step_stats, setStepStats] = useState({})
  
  useEffect(() => {
    if (props.looks) {
      setString(['(','86', '+', '92', ')','-','90','∩','89'])
    }
  },[props.looks])

  useEffect(() => {
    updateSqlObj(string)
    setStepStats({})
  }, [string])

  const updateSqlObj = async (st) => {
    var current_sql_obj = Object.assign({},sql_obj)
    var new_queries = []
    var new_query_looks = []
    st = st.filter((s)=>{ return '+-∩() '.indexOf(s) === -1 })
    st = st.filter((s)=>{ return Object.keys(current_sql_obj).indexOf(s) === -1 })
    st.forEach(s=> {
      var look = find(props.looks, {id: Number(s)});
      new_query_looks.push(look.id)
      new_queries.push(getNewSql(look.id, look));
    })
    const new_queries_out = await Promise.all(new_queries)
    new_queries_out.forEach(obj=>{
      current_sql_obj = Object.assign(current_sql_obj,obj)
    })
    setSqlObj(current_sql_obj)
  }

  useEffect(()=>{
    setExpressionCount('')
    setSqlSlug(undefined)
    setExploreOk(undefined)
    setDownloadJson(undefined)
    setSqlExploreMetadata(undefined)
  },[string])


  // Start Functions {

  const setSlug = async (sql_out) => {
    return new Promise ( async (resolve, reject) => {
      var look_slug = await api31Call('POST','/sql_queries','',{
        connection_name: props.selected.explore_metadata.connection_name,
        sql: sql_out
      })
      if (look_slug.slug) {
        setSql_slug(look_slug.slug)
        resolve(look_slug.slug)
      }
    })
  }

  const getFinalCount = async () => {
    
  }

  const getNewSql = (look_id, look) => {
    const field = props.selected.cohort_field_name
    return new Promise (async (resolve, reject) => {
      var q = await api31Call('POST','/queries','', updateQuery(look.query,field))
      var q_sql = await api31CallSqlText('GET', `/queries/${q.id}/run/sql`)
      q_sql = q_sql.replace(new RegExp('\nLIMIT 100000'),'');
      resolve({[look_id]: q_sql})
    })
  }

  const onDrop = ({dataTransfer, ...event}) => {
    const current_values = [].concat(string)
    const old_position = (dataTransfer && dataTransfer.getData('position')) ? dataTransfer.getData('position') : undefined
    if (old_position) {
      delete current_values[old_position]
      current_values
    }
    var filtered_values = current_values.filter(o=>{ return o!==' '})
    var new_values = []
    filtered_values.forEach((v)=>{
      new_values.push(' ')
      new_values.push(v)
    })
    new_values.push(' ')
    setString(new_values)
  }

  const onDragOver = (event) => {
    event.dataTransfer.dropEffect = 'copy'
    event.preventDefault();
  }

  const postForSqlSlug = (sql) => {
    return new Promise ( async ( resolve, reject ) => {
      var sql_create = await api31Call('POST','/sql_queries','',{
        connection_name: props.selected.explore_metadata.connection_name,
        sql: sql.replace(/\s+/g,' ')
      })
      if (sql_create && sql_create.slug) {
        resolve(sql_create.slug)
        setSqlSlug(sql_create.slug)
      }
    })
  }

  const checkExplore = (slug) => {
    return new Promise ( async (resolve, reject) => {
      var query_id = undefined
      while (!query_id) {
        try {
          var new_query = await api31Call('POST','/queries','',{
            model: `sql__${slug}`,
            view: 'sql_runner_query',
            fields: ['sql_runner_query.count'],
          })
        } catch {
          // console.log(new_query)
        }
        if (new_query && new_query.id) {
          query_id = new_query.id
          break
        } else {
          await setExploreBySqlRun(slug)
        }
      }
      resolve(query_id)
    })
  }

  const setExploreBySqlRun = (slug) => {
    return new Promise ( async (resolve, reject) => {
      var sql_download = await api31Call('POST',`/sql_queries/${slug}/run/json`,'download=true',{})            
      setDownloadJson(sql_download)
      setExploreOk(true)
      resolve(sql_download)
    })
  }

  const getCountFromExplore = (slug) => {
    return new Promise( async (resolve, reject) => {
      var count_query = await api31Call('POST','/queries','',{
        model: `sql__${slug}`,
        view: 'sql_runner_query',
        fields: ['sql_runner_query.count'],
      })
      var get_count = await api31Call('GET',`/queries/${count_query.id}/run/json`,'cache=true')
      const count = get_count[0][Object.keys(get_count[0])[0]]
      setExpressionCount(count)
      resolve({count: count, field: Object.keys(get_count[0])[0], query_id: count_query.id})
    })
  }

  const calculateButton = async (rpn_sql, rpn) => {
    var task_id = await getSqlCountFromSql(rpn_sql, props.selected.explore_metadata.connection_name)
    updateTasks([{ops: rpn, task: task_id}],'add')
    // return new Promise ( async (resolve, reject ) => {
    //   setCalculateLoader(true)
    //   var slug
    //   if (!sql_slug) {
    //     slug = await postForSqlSlug(rpn_sql)
    //   } else {
    //     slug = sql_slug
    //   }
    //   if (!explore_ok) {
    //     await checkExplore(slug)
    //   }
    //   var explore_metadata = await getCountFromExplore(slug)
      // setCalculateLoader(false)
      // setSqlExploreMetadata(explore_metadata)
      // resolve(explore_metadata)
    // })
  }

  const saveButton = async (rpn_sql) => {
    setLookLoader(true)
    var explore_metadata
    if (!sql_explore_metadata) {
      explore_metadata = await calculateButton(rpn_sql)
    } else {
      explore_metadata = sql_explore_metadata
    }

    var look =  await api31Call('POST','/looks','', {
      query_id: explore_metadata.query_id,
      space_id: props.space_id,
      title: look_title,
      description: JSON.stringify({
        type: 'Cohort Expression',
        field: props.selected.cohort_field_name,
        view: find(props.selected.explore_metadata._cohort_joins, {'cohort_dimension': props.selected.cohort_field_name})['view'],
        expression: rpn,
        slug: sql_slug
      })
    })
    setLookLoader(false)
    props.fns.updateContent('looks')
  }

  const updateTasks = (task_arr, type) => {
    var new_arr = [].concat(tasks)
    if (type === 'add') {
      task_arr.forEach(t=>{
        if (findIndex(new_arr, {ops: t.ops}) === -1 ) {
          new_arr.push(t)
        }
      })
    } else if (type === 'remove' ) {
      task_arr.forEach(t=>{
        const i = findIndex(new_arr, {ops: t.ops})
        if ( i > -1) {
          new_arr = new_arr.slice(0, i).concat(new_arr.slice(i + 1, new_arr.length))
        }
      })
    }
    setTasks(new_arr)
  }

  const setTaskCounts = async (finished_tasks) => {
    const get_results = finished_tasks.map(t=>{
      return api31Call('GET',`/query_tasks/${t.task}/results`)
    })
    const results = await Promise.all(get_results)
    const task_obj = finished_tasks.map((t,i)=>{
      const first_row = results[i]['data'][0]['sql_runner_query.count']
      return {
        ops: t.ops,
        count: first_row['rendered'] || first_row['value'] || first_row
      }
    })
    updateTaskCounts(task_obj)
  }

  const updateTaskCounts = (result) => {
    var new_obj = {}
    result.forEach(r=>{
      new_obj[r.ops] = String(r.count)
    })
    var cur_steps = Object.assign({},step_stats)
    setStepStats(Object.assign(cur_steps,new_obj))
  }

  // } End Functions

  const string_parsed = getParsed( string.filter(s=>{return s !==' '}))
  const verify = verifyString(string_parsed)
  const rpn = (verify.ok) ? string_parsed : []
  const rpn_obj = rpnFun(rpn, sql_obj)
  
  const rpn_sql = (verify.ok && rpn_obj.sql) ? rpn_obj.sql : ''
  const found_look_title = find(props.looks || [], {title: look_title})
  const look_title_error = ( found_look_title && found_look_title.title ) ? true : false
  const look_obj = keyBy(props.looks,'id')
  const steps = (rpn_obj && rpn_obj.steps) ? rpn_obj.steps : []

  return (
    <>
    <Grid stretched>
      <Grid.Row >
        <Grid.Column width="7" style={{paddingRight: '0px'}}>
          <Segment style={{textAlign: 'center'}}>
            {Object.keys(OPERATORS).map(op=>{return createButton(op)})}
            <Button 
              className="blue"
              onDragOver={(e)=>{onDragOver(e)}}
              onDragEnter={(e)=>{onDragOver(e)}}
              onDrop={(e)=>{onDrop(e)}}
              style={{minWidth: 'calc(100% / 7)'}}
              draggable={false}
              active={false}
              icon='trash'
            ></Button>
            <TypeAheadText string={string} setString={setString} {...props}></TypeAheadText>
          </Segment>
        </Grid.Column>
      <Grid.Column width="9" style={{paddingLeft: '0px'}}>
        <Segment style={{textAlign: 'center'}}>
          <Button basic={!show_sql} onClick={()=>{setShowSql(!show_sql)}}>SQL</Button>
          <RunningTasks 
            steps = {steps}
            look_obj={look_obj}
            tasks={tasks} 
            updateTasks={updateTasks}
            setTaskCounts={setTaskCounts}
            step_stats={step_stats}
          ></RunningTasks>
          <Button 
            as='div' 
            labelPosition='right'
          >
            <Button 
              basic
              disabled={!verify.ok}
              onClick={()=>{calculateButton(rpn_sql, rpn_obj.s[0])}}
              loading={((step_stats && step_stats[rpn_obj.s[0]]) || findIndex(tasks, {ops: rpn_obj.s[0]}) === -1 ) ? false : true}
            >
             <Icon name='calculator' />
              Calculate
            </Button>
            <Label as='a' basic pointing='left'>
              {(step_stats[rpn_obj.s]) ? step_stats[rpn_obj.s[0]] : ''}
            </Label>
          </Button>
            <Input     
              size='medium'
              id="look-input"
              error={look_title_error}
              size='small'
              action={{ 
                icon:'plus',
                className: (look_loader) ? 'loading': '', 
                onClick: ()=>{saveButton(rpn_sql)},
                disabled: (look_title === '' || look_title_error)
              }}
              labelPosition='right'
              placeholder="Cohort Name"
              onChange={(event,data)=>{setLookTitle(data.value)}}
              value={look_title}
            >
            </Input>
            <Segment       
              style={{ height: '90%', textAlign: 'left', "whiteSpace": "pre-wrap", wordWrap: "break-word" }}
            >
              { !verify.ok && <>{verify.message}</>}
              { !show_sql && verify.ok &&<MergeCohortSteps
                step_stats={step_stats}
                updateTasks={updateTasks}
                selected={props.selected}
                rpn_obj={rpn_obj}
                tasks={keyBy(tasks,'ops')}
                look_obj={look_obj}
                ></MergeCohortSteps> }
              { show_sql && verify.ok && <>{rpn_sql}</> }
            </Segment>
          </Segment>
        </Grid.Column>     
      </Grid.Row>
    </Grid>
    </>
  )
}

function updateQuery(old_query, new_field) {
  return Object.assign(old_query, {
    id: null,
    client_id: null,
    fields: [new_field],
    limit: -1,
    sorts: ["__UNSORTED__"]
  })
}

function getParsed(infix) {

  function Stack() {
    this.dataStore = [];
    this.top = 0;
    this.push = push;
    this.pop = pop;
    this.peek = peek;
    this.length = length;
  }
  
  function push(element) {
    this.dataStore[this.top++] = element;
  }
  
  function pop() {
    this.top += -1
    const ret = this.dataStore.pop()
    return ret;
  }
  
  function peek() {
    return this.dataStore[this.top-1];
  }
  
  function length() {
    return this.top;
  }
  
  // infix = infix.replace(/\s+/g,' '); // remove spaces, so infix[i]!=" "
  // infix = infix.trim().split(' ')
  
  var s = new Stack();
  var ops = "-+∩";
  var precedence = {"∩":3, "+":2, "-":2};
  var associativity = {"∩":"Left", "+":"Left", "-":"Left"};
  var token;
  var postfix = "";
  var o1, o2;
  
  for (var i = 0; i < infix.length; i++) {
    token = infix[i];
    if (!isNaN(parseInt(token)) && isFinite(token)) { // if token is operand (here limited to 0 <= x <= 9)
      postfix += token + " ";
    }
    else if (ops.indexOf(token) != -1) { // if token is an operator
      o1 = token;
      o2 = s.peek();
      while (ops.indexOf(o2)!=-1 && ( // while operator token, o2, on top of the stack
        // and o1 is left-associative and its precedence is less than or equal to that of o2
        (associativity[o1] == "Left" && (precedence[o1] <= precedence[o2]) ) || 
        // the algorithm on wikipedia says: or o1 precedence < o2 precedence, but I think it should be
        // or o1 is right-associative and its precedence is less than that of o2
        (associativity[o1] == "Right" && (precedence[o1] < precedence[o2])) 
        )){
          postfix += o2 + " "; // add o2 to output queue
          s.pop(); // pop o2 of the stack
          o2 = s.peek(); // next round
      }
      s.push(o1); // push o1 onto the stack
    }
    else if (token == "(") { // if token is left parenthesis
      s.push(token); // then push it onto the stack
    }
    else if (token == ")") { // if token is right parenthesis 
      while (s.peek() != "("){ // until token at top is (
        postfix += s.pop() + " ";
      }
      s.pop(); // pop (, but not onto the output queue
    }
  }
  postfix += s.dataStore.reverse().join(' ');
  postfix = postfix.replace(/\s+/g,' ')
  return postfix.split(' ').filter(o=>{return o != ''})
}

function rpnFun (rpn, sqls) {
  var steps = []
  var s=[];

  var sql_map = {"∩":"INTERSECT", "+":"UNION", "-":"EXCEPT"};  

  for (var i in rpn) {
    var t=rpn[i], n=+t
    if (n == t) {
      s.push(n)
    }
    else {
      var o2=s.pop(), o1=s.pop()
      const cur_ops = `${o1}${t}${o2}`
      if (s.length === 0) {
        sqls[cur_ops] = [sqls[o1], sql_map[t], sqls[o2]].join('\n')
        steps.push({o1: o1, o2: o2, op: t, sql: [sqls[o1], sql_map[t], sqls[o2]].join('\n'), cur_ops: cur_ops})
      } else {
        steps.push({o1: o1, o2: o2, op: t, sql: ['SELECT * FROM (', sqls[o1], sql_map[t], sqls[o2], ')'].join('\n'), cur_ops: cur_ops})
        sqls[cur_ops] = ['SELECT * FROM (', sqls[o1], sql_map[t], sqls[o2], ')'].join('\n')
      }
      s.push(cur_ops)
    }
  }
  return {s: s, sql: sqls[s], steps: steps}
}

function verifyString(e) {
  e = e.filter(e=>{ return e !== ' '})
  const ok = () => { return {ok: true}}
  const error = (m) => { return {ok: false, message: m}}
  var s=[]

  // e=e.split(' ')

  for (var i in e) {
    var t=e[i], n=+t
    if (!t) continue
    if (n == t)
      s.push(n)
    else {
      if ('()'.indexOf(t) > -1) {
        return error('Unclosed Parantheses!')
      }
      if ('+-∩'.indexOf(t) == -1) {
        return error('Unknown operator!')
      }
      if (s.length<2) {
        return error('Insufficient operands!')
      }
      var o2=s.pop(), o1=s.pop()
      switch (t) {
        case '+': s.push(o1+o2); break
        case '-': s.push(o1-o2); break
        case '∩': s.push(o1*o2); break
      }
    }
  }
  if (s.length>1) {
    return error('Insufficient operands!')
  }
  return ok()
}

function createButton (op) {
  return <Button 
  style={{minWidth: 'calc(100% / 7)'}}
    onDragStart={(e)=>{onDragStart(e)}}
    draggable 
    active={false}
    value={op}
    key={op}>{op}
  </Button>
}