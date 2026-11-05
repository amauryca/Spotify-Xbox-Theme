import React,{useState,useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {request} from './bridge';
import {navigateConsoleSettings} from './settings-navigation';
import type {MenuScreenProps} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/MenuListItem';

const arrowActions = {
  ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
} as const;
import {Toolbar} from './toolbar';
import {getPortalRoot} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/portal';
export function ConsoleSettingsScreen({onClose}: MenuScreenProps){
const surface=useRef<HTMLElement>(null);
const pendingUpdate=useRef(Promise.resolve());
const updateSequence=useRef(0);
useEffect(()=>{
  const opener=document.activeElement as HTMLElement|null;
  surface.current?.querySelector<HTMLElement>('.console-columns nav button')?.focus();
  return ()=>{requestAnimationFrame(()=>{if(opener?.isConnected)opener.focus()});};
},[]);
const [data,setData]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tab,setTab]=useState('Audio'),[draft,setDraft]=useState<number|null>(null);useEffect(()=>{let alive=true;const poll=()=>request('settings').then(s=>{if(alive)setData(s)}).catch(e=>{if(alive)setError(e.message)});poll();const timer=setInterval(poll,1000);return()=>{alive=false;clearInterval(timer)}},[]);async function change(key:string,value:any){setBusy(true);setError('');
const sequence=++updateSequence.current;
pendingUpdate.current=pendingUpdate.current.then(async()=>{
 try {
   const next=await request('settings-update',{key,value});
   if(sequence===updateSequence.current)setData(next);
 } catch(e:any){if(sequence===updateSequence.current)setError(e.message)}
 finally {if(sequence===updateSequence.current){setBusy(false);setDraft(null)}}
});}return createPortal(<section ref={surface} className="console-settings" role="dialog" aria-modal="true" aria-label="Console Settings" onKeyDown={e=>{
 e.stopPropagation();
 if(e.key==='Escape'){e.preventDefault();onClose();return;}
 const action=arrowActions[e.key as keyof typeof arrowActions];
 if(!action || e.altKey || e.ctrlKey || e.metaKey)return;
 if((action==='left'||action==='right') && e.target instanceof HTMLInputElement && e.target.type==='range')return;
 e.preventDefault();
 navigateConsoleSettings(e.currentTarget,action);
}}><Toolbar/><header><h1>Console Settings</h1><button data-console-back onClick={onClose}>Back</button></header><p className="console-navigation-hint">↑ ↓ Move · → Open controls · Enter / A Select · Esc / B Back</p><div className="console-columns"><nav aria-label="Console settings categories">{['Audio','Playback','Spotify Settings',...(data?.startupAvailable?['Startup']:[])].map(t=><button aria-pressed={tab===t} key={t} onClick={()=>setTab(t)}>{t}</button>)}</nav><div className="console-pane"><h2>{tab}</h2>{!data?<p>Connecting to Spotify…</p>:tab==='Audio'?<><label>Spotify volume <strong>{Math.round((draft??data.volume??0)*100)}%</strong><input aria-label="Spotify volume" disabled={data.volume===null} type="range" min="0" max="1" step=".01" value={draft??data.volume??0} onChange={e=>setDraft(Number(e.target.value))} onPointerUp={e=>change('volume',Number(e.currentTarget.value))} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))change('volume',Number(e.currentTarget.value))}}/></label><p>Uses the same volume as Spotify. Changes in either view appear here.</p><button onClick={()=>request('native-settings',{section:'audio'})}>Audio quality</button><button onClick={()=>request('native-settings',{section:'playback'})}>Normalization &amp; equalizer</button></>:tab==='Playback'?<><label><input type="checkbox" aria-busy={busy} disabled={data.shuffle===null} checked={!!data.shuffle} onChange={e=>change('shuffle',e.target.checked)}/> Shuffle</label><label>Repeat <select aria-label="Spotify repeat" aria-busy={busy} disabled={data.repeat===null} value={data.repeat??0} onChange={e=>change('repeat',Number(e.target.value))}><option value="0">Off</option><option value="1">All songs</option><option value="2">One song</option></select></label><p>These controls stay in sync with Spotify playback.</p><button onClick={()=>request('native-settings',{section:'transitions'})}>Track transitions &amp; crossfade</button><button onClick={()=>request('native-settings',{section:'playback'})}>Playback settings</button><button onClick={()=>request('native-settings',{section:'autoplay'})}>Autoplay</button></>:tab==='Startup'?<><label><input type="checkbox" aria-busy={busy} checked={data.startup} onChange={e=>change('startup',e.target.checked)}/> Play Xbox animation when Spotify opens</label><label><input type="checkbox" aria-busy={busy} checked={data.startupSound} onChange={e=>change('startupSound',e.target.checked)}/> Startup sound</label><p>Escape or Skip intro goes straight to your dashboard.</p><button onClick={()=>request('replay-startup')}>Replay startup animation</button></>:<><p>Open Spotify’s actual settings for language, audio quality, downloads, autoplay, crossfade, and all other preferences.</p><button onClick={()=>request('native-settings')}>Open Spotify Settings</button><div className="settings-shortcuts">{[['Language','language'],['Display','display'],['Downloads & storage','storage'],['Startup & window behavior','startup']].map(([label,section])=><button key={section} onClick={()=>request('native-settings',{section})}>{label} ›</button>)}</div><p>These are Spotify’s own saved settings. Use Xbox Dashboard to return.</p></>}{error&&<p role="alert">{error}</p>}</div></div></section>,getPortalRoot())}
