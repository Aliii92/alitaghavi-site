"use client";
import {createContext,useContext,useEffect,useState} from "react";
const Context=createContext(null);
const KEY='ali-property-preferences-v1';
export function PropertyPreferences({children}) {
 const [value,setValue]=useState({saved:[],compare:[]});const [ready,setReady]=useState(false);const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');setValue({saved:Array.isArray(v.saved)?v.saved.filter(x=>typeof x==='string').slice(0,100):[],compare:Array.isArray(v.compare)?v.compare.filter(x=>typeof x==='string').slice(0,3):[]});}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(value));}catch{setStorageError(true);}},[value,ready]);
 const toggle=(kind,id)=>setValue(v=>({...v,[kind]:v[kind].includes(id)?v[kind].filter(x=>x!==id):[...v[kind],id].slice(0,kind==='compare'?3:100)}));
 return <Context.Provider value={{...value,ready,toggle,storageError}}>{children}</Context.Provider>;
}
export const usePropertyPreferences=()=>useContext(Context);
