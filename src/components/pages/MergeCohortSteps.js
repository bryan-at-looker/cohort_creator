import React, {useEffect, useState, useRef} from 'react'
import { Table, Button, Modal } from 'semantic-ui-react'
import "semantic-ui-css/semantic.min.css"
import {find, findIndex, isEqual} from 'lodash'
import { VennDiagram } from './VennDiagram'
import { getLookFieldCountFromLookId, getSqlCountFromSql } from '../../helpers'

export function MergeCohortSteps({rpn_obj, look_obj, updateTasks, step_stats, tasks, ...props}) {
  const [step_calculate_click, setStepCalculateClick] = useState({})
  const [selected_venn, setSelectedVenn] = useState(undefined)
  const [modal_step, setModalStep] = useState(undefined) 

  const prev_rpn_obj = usePrevious({rpn_obj});

  // useEffect(() => {
  //   console.log(rpn_obj)
  // })

  // not working
  // useEffect(() => {
  //   if (!isEqual(prev_rpn_obj, rpn_obj) ) {
  //     setSelectedVenn(undefined)
  //   }
  // },[rpn_obj])

  useEffect(()=>{
    // console.log(step_stats)
  },[step_stats])

  const calculateStep = async (steps, i) => {
    const step = steps[i]
    var tasks = []
    if (step_stats && step_stats[step.cur_ops] && step_stats[step.o1] && step_stats[step.o2]) {
      // do something
    } else {
      var o1 = runStepStat(step.o1)
      var o2 = runStepStat(step.o2)
      var cur_ops = runStepStat(step.cur_ops)   
      const all = await Promise.all([o1, o2, cur_ops])
      const out = [
        {ops: step.o1, task: all[0]},
        {ops: step.o2, task: all[1]},
        {ops: step.cur_ops, task: all[2]},
      ]
      updateTasks(out, 'add')
    }
  }

  const runStepStat = (stat) => {
    var s=stat, t=+stat
    if (s == t) {
      return getLookFieldCountFromLookId(stat)
    } else {
      const find_sql = find(steps, {cur_ops: stat})
      return getSqlCountFromSql(find_sql.sql, props.selected.explore_metadata.connection_name)
    }
  }



  const tableRow = (steps) => {
    return steps.map((step,i) => {
      step.o2_look = look_obj[step.o2] || { title: `Step ${findIndex(steps, {cur_ops: step.o2})+1}` }
      step.o1_look = look_obj[step.o1] || { title: `Step ${findIndex(steps, {cur_ops: step.o1})+1}` }
      const can_venn = (step_stats && step_stats[step.o1] && step_stats[step.o2] && step_stats[step.cur_ops]) ? true : false
      const calc = {
        o1: (step_stats && step_stats[step.o1]) ? step_stats[step.o1] : undefined, 
        o2: (step_stats && step_stats[step.o2]) ? step_stats[step.o2] : undefined, 
        final: (step_stats && step_stats[step.cur_ops]) ? step_stats[step.cur_ops] : undefined
      }

      return <Table.Row key={i}>
        <Table.Cell width={10} style={{textAlign: 'center'}}>
          {createOperator(step,i,calc)}
          <br/><Button.Group style={{marginTop: '5px'}}>
            <Button 
              size='small'
              disabled={!can_venn}
              className={(selected_venn == i)?'blue':''}
              icon={'toggle off'} 
              value={i} 
              onClick={(event,data)=>{setSelectedVenn(data.value)}}
            ></Button>
            <Button size='small' value={i} onClick={(event,data)=>{setModalStep(data.value)}}>SQL</Button>
            <Button 
              disabled={(calc && calc.o1!==undefined && calc.o2!==undefined && calc.final!==undefined) ? true : false}
              size='small'
              icon={'calculator'} 
              value={i} 
              onClick={(event,data)=>{calculateStep(steps, i)}}
            ></Button>
          </Button.Group>
        </Table.Cell>
        {selected_venn == i && can_venn && <><Table.Cell width={6}>  
          <VennDiagram
            o1={step.o1_look.title}
            o2={step.o2_look.title}
            op={step.op}
            i={i}
            calc={calc}
          ></VennDiagram> 
        </Table.Cell></> }
      </Table.Row>
    })
  }

  const modalOperator = (step,i) => {
    step.o2_look = look_obj[step.o2] || { title: `Step ${findIndex(steps, {cur_ops: step.o2})+1}` }
    step.o1_look = look_obj[step.o1] || { title: `Step ${findIndex(steps, {cur_ops: step.o1})+1}` }
    return createOperator(steps[modal_step],0)
  }


  const steps = (rpn_obj && rpn_obj.steps) ? rpn_obj.steps : []

  return (
    <>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Cell><h3>Steps</h3></Table.Cell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tableRow(steps)}
        </Table.Body>
      </Table>
      { modal_step !== undefined && <Modal 
        open={(modal_step!==undefined)?true:false}
        closeIcon
        onClose={()=>setModalStep(undefined)}
      >
       <Modal.Header>
          {modalOperator(steps[modal_step],0)}
        </Modal.Header>
        <Modal.Content style={{ textAlign: 'left', "whiteSpace": "pre-wrap", wordWrap: "break-word" }}>
          {steps[modal_step].sql}
        </Modal.Content>
      </Modal> }
    </>
  )
}

function createOperator (step, i, calc) {
  return <>
     <Button
      size='small'
      style={{marginTop: '3px'}}
      as="span"
      basic
      key={i + '::o1'}
    >{step.o1_look.title}{(calc && calc.o1 !== undefined)?`: ${calc.o1}`:''}
    </Button>
    <Button
      size='small'
      style={{marginTop: '3px'}}
      as="span"
      key={i + '::op'}
    >{step.op}
    </Button>
    <Button
      size='small'
      style={{marginTop: '3px'}}
      as="span"
      basic
      key={i + '::o2'}
    >{step.o2_look.title}{(calc && calc.o2 !== undefined)?`: ${calc.o2}`:''}
    </Button>
    { calc && calc.final && <><Button
      size='small'
      style={{marginTop: '3px'}}
      as="span"
      key={i + '::eq'}
    >{'='}
    </Button>
    <Button
      size='small'
      basic
      style={{marginTop: '3px'}}
      as="span"
      key={i + '::final'}
    >{(calc && calc.final !== undefined)?`End Step: ${calc.final}`:''}
    </Button></> }
  </>
}

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}