import {useEffect,useState} from 'react';
import {request} from './bridge';
let cached:any=null;const listeners=new Set<(p:any)=>void>();let pending:any=null;
function refresh(){if(!pending)pending=request('profile').then(p=>{cached=p;listeners.forEach(fn=>fn(p))}).catch(()=>{}).finally(()=>pending=null);return pending}
export function useSpotifyProfile(){const [profile,setProfile]=useState<any>(cached);useEffect(()=>{listeners.add(setProfile);refresh();const eager=setTimeout(refresh,2000);const id=setInterval(refresh,30000);return()=>{listeners.delete(setProfile);clearInterval(id);clearTimeout(eager)}},[]);return profile}
