import React, {useEffect, useState} from 'react'
import { TextArea, Menu, Button, Grid, Segment, Item } from 'semantic-ui-react';
import {orderBy, filter} from 'lodash'
import {onDragStart} from '../../helpers'
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
        onDragStart={(e)=>onDragStart(e)}
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
      style={{marginTop: '3px'}}
      onDragStart={(e)=>{onDragStart(e)}}
      as="span"
      basic={t == n}
      className={(t == ' ')?'hidden':''}
      // onDragOver={(e)=>{ drag}}
      key={i}
      position={i}
      value={thing}
    >{operators[thing]}
    </Button>
  })

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
      <Segment 
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        height: '90%',
        textAlign: 'center'
      }}>
        {things}
      </Segment>
    </>
  )
}