import React, {useEffect, useState} from 'react'
import { api31Call } from '../../helpers'
import { findIndex, find } from 'lodash'
import { Modal, Button } from 'semantic-ui-react'

var running_tasks = []

export function RunningTasks({tasks, updateTasks, setTaskCounts, step_stats, steps, look_obj, ...props}) {
  const [running, setRunning] = useState(false)
  
  useEffect(() => {
    
  })

  useEffect(() => {
    if (tasks.length > 0) {
      var tks = [].concat(running_tasks)
      tasks.forEach(t=>{
        if (!(step_stats && step_stats[t.ops]) && findIndex(tks, { ops: t.ops }) === -1) {
          tks.push(t)
        }
      })
      running_tasks = tks
      if (!running && tks.length > 0) {
        setRunning(true)
        shortPollTasks() 
      }
    }
  },[tasks])

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const shortPollTasks = async () => {
    if (running_tasks && running_tasks.length > 0) {
      var finished = []
      var not_finished = []
      const just_tasks = running_tasks.map(t=>{return t.task})
      var multi_results = await api31Call('GET','/query_tasks/multi_results',`query_task_ids=${just_tasks.join(',')}`)
      running_tasks.forEach((t, i)=>{
        const r = multi_results[t.task]
        if (r.status === 'expired' || r.status === 'complete') {
          finished.push(t)
        } else {
          not_finished.push(t)
        }
      })
      if (finished.length > 0) {
        setTaskCounts(finished)
        await delay(1000);
        updateTasks(finished, 'remove')
        await delay(1000);
        finished.forEach(f=>{
          running_tasks = running_tasks.filter(o=>{return o.ops !== f.ops})
        })
      }
      if (not_finished.length > 0) {
        await delay(5000);
        shortPollTasks()
      } else {
        setRunning(false)
      }
    }
  }

  const running_ops = (running && running_tasks && running_tasks.length > 0) ? running_tasks.map(t=>{return t.ops}) : []
  const buttons = running_ops.map(ops=>{return createOperators(ops, look_obj, steps) } )
  return (
    <>
      <Modal closeIcon trigger={<Button className={(running_ops.length > 0)?'loading':''} icon={(running_ops.length > 0)?'':'check'}></Button>}>
        <Modal.Header>
          {(running) ? 'Queries are running' : 'No queries running'}
        </Modal.Header>
        <Modal.Content>
          { buttons }
        </Modal.Content>
      </Modal>    
    </>
  )
}

function createOperators (ops, look_obj, steps) {
  var s=ops, t=+ops
  if (s == t) {
    return <>
      {lookOperator(look_obj, ops)}
      <br/>
    </>
  } else {
    const cur = find(steps, {cur_ops: ops})
    const o1 = (cur.o1 == Number(cur.o1)) ? lookOperator(look_obj, cur.o1) : nonLookOperator(steps, cur.o1, 'o1')
    const o2 = (cur.o2 == Number(cur.o2)) ? lookOperator(look_obj, cur.o2) : nonLookOperator(steps, cur.o2, 'o2')
    const op = cur.op
    return <>
    {o1}
    <Button
      size='small'
      style={{marginTop: '3px'}}
      as="span"
      key={`${ops}::op`}
    >{op}
    </Button>
    {o2}
    <br/>
    </>
  }
}

function lookOperator (look_obj,ops) {
  return <>
  <Button
    size='small'
    style={{marginTop: '3px'}}
    as="span"
    basic
    key={`${ops}::look`}
  >{look_obj[ops].title}
  </Button>
  </>
}

function nonLookOperator (steps, ops, type) {
  return  <Button
    size='small'
    style={{marginTop: '3px'}}
    as="span"
    key={`${ops}::${type}`}
  >{`Step ${findIndex(steps, {cur_ops: ops})+1}`}
  </Button>
}