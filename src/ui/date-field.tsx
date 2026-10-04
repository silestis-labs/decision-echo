import React,{useEffect,useRef,useState} from 'react';
export function localDate(value:string|null){if(!value)return '';const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
export function DateField({value,label,onCommit}:{value:string|null;label:string;onCommit:(value:string|null)=>void}){
 const [error,setError]=useState('');const editing=useRef(false),input=useRef<HTMLInputElement>(null);
 // Native segmented date editing keeps its own incomplete values until blur.
 // React must not replace partial segments with a parsed ISO value on each keystroke.
 useEffect(()=>{if(!editing.current&&input.current){input.current.value=localDate(value);setError('');}},[value]);
 function commit(){editing.current=false;const field=input.current;if(!field)return;if(field.validity.badInput){setError('Complete the date or explicitly clear all its segments.');return;}const draft=field.value;if(!draft){setError('');onCommit(null);return;}const d=new Date(draft);if(!Number.isFinite(d.getTime())||d.getFullYear()<2000||d.getFullYear()>2100){setError('Enter a complete date between 2000 and 2100.');return;}setError('');onCommit(d.toISOString());}
 return <><input ref={input} type="datetime-local" aria-label={label} aria-invalid={!!error} min="2000-01-01T00:00" max="2100-12-31T23:59" defaultValue={localDate(value)} onFocus={()=>{editing.current=true;}} onChange={()=>setError('')} onBlur={commit}/>{error&&<small role="alert">{error}</small>}</>;
}
