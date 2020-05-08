import React, {useEffect, useState, Component} from 'react'
import { render } from 'react-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import highchartsVenn from "highcharts/modules/venn";

 
const OPTIONS = {
  credits: {
    enabled: false
  },
  series: [{
    type: 'venn',
    name: '',
    data: []
  }],
  title: {
    text: ''
  }
}

export function VennDiagram({o1,o2,op,calc, ...props}) {
  calc.o1 = parseFloat(calc.o1.replace(/,/g, ''))
  calc.o2 = parseFloat(calc.o2.replace(/,/g, ''))
  calc.final = parseFloat(calc.final.replace(/,/g, ''))
  const cool = highchartsVenn(Highcharts)
  var options = Object.assign({},OPTIONS)
  options.series[0].data = [
    {sets: [o1], value: calc.o1, color: color(op, 'o1')},
    {sets: [o2], value: calc.o2, color: color(op, 'o2')},
    {sets: [o1, o2], value: intersect(op, calc), color: color(op, '∩'), name: '∩'}
  ]
  
  return (
    <>
    <HighchartsReact
      highcharts={cool}
      options={options}
    />
    </> 
  )
}

function intersect(op, calc) {
  if (op === '∩') { return calc.final }
  if (op === '+') { return calc.o1 + calc.o2 - calc.final }
  if (op === '-') { return calc.o2 - calc.o1 + calc.final }
}

function color (op, type) {
  const n = '#a1a1a133'
  const a = '#43bc9333'
  const r = '#BC436C66'
  switch (type) {
    case 'o1':
      switch (op) {
        case '∩':
          return n
        case '+':
          return a
        case '-':
          return a
      }
      break;
    case 'o2':
      switch (op) {
        case '∩':
          return n
        case '+':
          return a
        case '-':
          return n
      }
      break;
    case '∩':
      switch (op) {
        case '∩':
          return a
        case '+':
          return a
        case '-':
          return r
      }
      break;
  }
  return n
}