import React, {useEffect, useState} from 'react'
import { TextArea, Menu, Button, Grid, Segment, Item } from 'semantic-ui-react';
import {orderBy, filter} from 'lodash'
import './css/TypeAheadText.css'

const OPERATORS = {
  '+': '+',
  '-': '-',
  '(': '(',
  ')': ')',
  '∩': '∩'
}

export function TypeAheadText({string, setString, looks, selected, ...props}) {

  const [text, setText] = useState('');
  // const [cool, setCool] = useState([]);

  // '(','90','-', '83', '∩', '(', '92', '+' ,'84', ')', ')', '+', '87'

  
  const suggestions = (looks || [] ).map(lk=>{return lk.title})
  

  useEffect(()=>{
    setText
  },[])

  useEffect(() => {
    // console.log(props)
  })


    
  const filtered_looks = filter(looks, (o) => {
    var description = {}
    try {
      description = JSON.parse(o.description)
    } catch {
    }
    return ( (`${o.query.model}::${o.query.view}`)== selected.explore ) && 
            description &&
            description.field==selected.cohort_field_name
  })

  var operators = Object.assign({},OPERATORS)

  filtered_looks.forEach(lk=>{
    operators[lk.id] = lk.title
  })


  const list = (orderBy(filtered_looks, [lk => lk.title.toLowerCase()], ['asc'])).map(lk => {
    return  <Menu.Item
        onDragStart={(event)=>onDragStart(event)}
        draggable 
        size="mini"
        id={lk.id}
        key={lk.id}
        value={lk.id}
      >{lk.title}
      </Menu.Item>
  })

  const things = string.map((thing,i) => {
    var t=thing, n=+thing
      return <Button
      draggable
      onDragStart={(e)=>{onDragStart(e)}}
      as="span"
      basic={t == n}
      className={(t == ' ')?'hidden':''}
      // onDragOver={(e)=>{ drag}}
      key={i}
      position={i}
      value={thing}
    >{operators[thing] || 'a'}
    </Button>
  })


  const createButton = (op) => {
    return <Button 
      onDragStart={onDragStart}
      draggable 
      active={false}
      size='mini' 
      value={op}
      key={op}>{op}
    </Button>
  }

  const onDragStart =  ({target, dataTransfer, ...event}) => {
    if (target && dataTransfer) {
      dataTransfer.setData('value', target.getAttribute('value') )
      dataTransfer.setData('position', target.getAttribute('position'))
    }
  }

  const onDragOver = (event) => {
    event.preventDefault();
  }

  const onDrop = async ({target, dataTransfer, ...event}) => {
    const current_values = [].concat(string)
    const new_value =  await dataTransfer.getData('value')
    const old_position = (dataTransfer && dataTransfer.getData('position')) ? dataTransfer.getData('position') : undefined
    const new_position = (target && target.getAttribute('position')) ? target.getAttribute('position') : current_values.length-1
    if (old_position) {
      delete current_values[old_position]
      current_values
    }
    
    current_values.splice(new_position, 0, new_value)
    var filtered_values = current_values.filter(o=>{ return o!==' '})
    var new_values = []
    filtered_values.forEach((v)=>{
      new_values.push(' ')
      new_values.push(v)
    })
    new_values.push(' ')
    setString(new_values)
  }


  return (
    <>
      <Grid>
        <Grid.Row>
          <Grid.Column width='3'>
            <Menu vertical fluid>
              <Button.Group fluid>
                {Object.keys(OPERATORS).map(op=>{return createButton(op)})}
              </Button.Group>
              <Menu.Menu>
                {list}
              </Menu.Menu>
            </Menu>
          </Grid.Column>
          <Grid.Column width='13'>
            <Segment 
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{height: '100%'}}>
              {things}
            </Segment>
          </Grid.Column>
        </Grid.Row>

      </Grid>
    </>
  )
}