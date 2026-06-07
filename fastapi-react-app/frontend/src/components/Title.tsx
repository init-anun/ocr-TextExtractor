import React from 'react';

type Props = {
  classes?: string;
  text?: string;
}

export default function Title({classes, text} : Props) {
  return (
    <h1 className={ !classes ? 'title' : classes || 'title text-center' }>{ !text ? 'Title' : text}</h1>      
  )
}
