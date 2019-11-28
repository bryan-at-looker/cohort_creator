import React, {useEffect, useState} from 'react'
import { Dropdown, Button, Segment, Menu } from "semantic-ui-react";
import {find} from 'lodash'

import "semantic-ui-css/semantic.min.css"
import { api31Call, api31CallSqlText } from '../../helpers';
import { TypeAheadText } from './TypeAheadText';

export function MergeCohorts({...props}) {
  const [look_count, setLook_count] = useState('');
  const [sql_out, setSql_out] = useState(undefined)
  const [string, setString] = useState([' '])
  // const [sqls, setSqls] = useState(SQLS);
  useEffect(() => {
    // console.log(props)
  })

  // const handleClick = await (sql) => {
    // create SQL query
    // create query
    // save query as look
  // }

  const string_parsed = getParsed( string.join(' '))
  // const cool2 = rpnFun(cool, sqls)
  // const cool2 = rpnFun(["90","83","92","84","+","*","-"], sqls)

  const getLookCount = async (sql) => {
    var look_count_slug = await api31Call('POST','/sql_queries','',{
      connection_id: props.selected.explore_metadata.connection_name,
      sql: `SELECT count(1) as count FROM (${sql})`.replace(/\s+/g,' ')
    })
    var count = await api31Call('POST',`/sql_queries/${look_count_slug.slug}/run/json`,'',{})
    setLook_count(count[0][Object.keys(count[0])[0]])
    return look_count_slug.slug
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

  const getSQLs = (rpn) => {
    var sql_obj = {}
    var queries = []
    return new Promise( async (resolve, reject) => {
      rpn.forEach(r => {
        var t=r, n=+t
        if (n == t) {
          var look = find(props.looks, {id: n})
          if (look) {
            queries.push(getNewSql(t,look))
          }
        }
      })
      var queries_out = await Promise.all(queries)
      queries_out.forEach(q=> { Object.assign(sql_obj, q)})
      resolve(sql_obj)
    })
  }

  const saveLook = async () => {
    var createLookSQL = await api31Call('POST','/sql_queries','',{
      connection_id: selected.explore_metadata.connection_name,
      sql_text: sql
    })
    var runLook
  }

  const saveCohort = async (rpn) => {
    var sqls_new = await getSQLs(rpn)
    var create_sql = rpnFun(rpn, sqls_new)
    setSql_out(create_sql.sql)
    var slug = getLookCount(create_sql.sql)
    

    // var createLookSQL = api31Call('POST','/sql_queries','',{
    //   connection_id: props.explore_metadata.connection_name,
    //   sql_text: sql
    // })

    // var create_sql_explore = await api31Call('POST','')
    // var new_query = await api31Call('POST','/queries','',{
    //   model: query.model,
    //   view: query.view,
    //   fields: this.props.selected.explore_metadata._default_fields,
    //   filters: query.filters,
    //   filter_expression: query.filter_expression,
    //   dynamic_fields: query.dynamic_fields,
    //   limit: query.limit
    // })
    // var look =  await api31Call('POST','/looks','', {
    //   query_id: new_query.id,
    //   space_id: this.props.space_id,
    //   title: this.state.title,
    //   description: JSON.stringify({
    //     type: this.props.selected.cohort_type,
    //     field: this.props.selected.cohort_field_name,
    //     view: find(this.props.selected.explore_metadata._cohort_joins, {'cohort_dimension': this.props.selected.cohort_field_name})['view']
    //   })
    // })
    // const look_id = look.id.toString()
    // this.props.fns.updateApp({
    //   selected_look: look_id,
    //   running_cohorts: this.props.notifications.running_cohorts.concat([look_id]),
    //   cohort_notifications: this.props.notifications.cohort_notifications.concat([look_id])
    // })
    // api31Call('POST','/scheduled_plans/run_once','',{
    //   name: `Cohorts - Run ${look.id}`,
    //   look_id: look.id,
    //   require_no_results: false,
    //   require_results: false,
    //   require_change: false,
    //   scheduled_plan_destination: [
    //     {
    //       format: 'json',
    //       address: this.props.webhook_url,
    //       type: 'webhook'
    //     }
    //   ]
    // })
    // this.setState({
    //   title: ''
    // }, () => {
    //   this.props.fns.updateContent('looks');
    //   setTimeout( () => { 
    //     this.setState({icon: 'check', running: false}, () => {
    //       setTimeout( () => { this.setState({icon: 'plus'})}, 3000)
    //     })
    //   }, 3000)
    // });
  }

  const verify = verifyString(string_parsed)

  return (
    <>
    <Segment>
      <TypeAheadText string={string} setString={setString} {...props}></TypeAheadText>
      <br></br>
      <Button
        disabled = {!verify.ok}
        onClick={()=>{saveCohort(string_parsed)}}
      >{verify.ok ? 'Calculate': verify.message }</Button>
      {sql_out && <p style={{"whiteSpace": "pre"}}>{sql_out}</p>}
      <h1>{look_count}</h1>
    </Segment>
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
  
  infix = infix.replace(/\s+/g,' '); // remove spaces, so infix[i]!=" "
  infix = infix.trim().split(' ')
  
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
  return postfix.split(' ')
}

function rpnFun (rpn, sqls) {
  var s=[];

  var sql_map = {"∩":"INTERSECT", "+":"UNION", "-":"EXCEPT"};  

  for (var i in rpn) {
    var t=rpn[i], n=+t
    if (n == t) {
      s.push(n)
    }
    else {
      var o2=s.pop(), o1=s.pop()
      if (s.length === 0) {
        sqls[0] = [sqls[o1], sql_map[t], sqls[o2]].join('\n')
      } else {
        sqls[0] = ['SELECT * FROM (', sqls[o1], sql_map[t], sqls[o2], ')'].join('\n')
      }
      
      s.push(0)
    }
  }
  return {s: s, sql: sqls[s]}
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