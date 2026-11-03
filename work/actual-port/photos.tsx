import React, {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {view} from './bridge';
import {createPortal} from 'react-dom';
import {getPortalRoot} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/portal';

type Photo = {name:string; src:string};
type Collection = {photos:Photo[]; enabled:boolean; rotate:boolean};
const key = 'xbox-dashboard-photos';
let collection:Collection = {photos:[], enabled:false, rotate:true};
try { collection = JSON.parse(localStorage.getItem(key) || 'null') ?? collection; } catch {}
const subscribers = new Set<() => void>();
function subscribe(listener:() => void) {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
}
function save(next:Collection) {
  localStorage.setItem(key, JSON.stringify(next));
  collection = next;
  subscribers.forEach(listener => listener());
}
function usePhotos() {
  return useSyncExternalStore(subscribe, () => collection);
}
function useSlide(count:number, rotate:boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
    if (count < 2 || !rotate) return;
    const timer = setInterval(() => setIndex(i => (i+1)%count), 6000);
    return () => clearInterval(timer);
  }, [count, rotate]);
  return [Math.min(index, Math.max(0,count-1)),setIndex] as const;
}

export function PhotoBackdrop({clipPath}:{clipPath:string}) {
  const {photos, enabled, rotate} = usePhotos();
  const [index] = useSlide(photos.length, enabled && rotate);
  if (!enabled || !photos.length) return null;
  return <div className="photo-backdrop" style={{clipPath}} aria-hidden="true">
    {photos.map((photo,i) => <img key={i} src={photo.src} alt="" style={{opacity:i===index ? .52 : 0}}/>)}
  </div>;
}

async function readPhoto(file:File):Promise<Photo> {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) throw Error('Choose a JPEG, PNG, WebP, GIF or AVIF image.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1280/Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(bitmap.width*scale));
    canvas.height = Math.max(1,Math.round(bitmap.height*scale));
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#151515';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    return {name:file.name,src:canvas.toDataURL('image/jpeg',.76)};
  } finally { bitmap.close(); }
}

export function PictureBrowserScreen() {
  const screen = useRef<HTMLElement>(null);
  useEffect(() => { screen.current?.focus(); }, []);
  const state = usePhotos();
  const [index,setIndex] = useSlide(state.photos.length,state.rotate);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const photo = state.photos[index];
  function update(next:Collection) {
    try { save(next); setError(''); } catch { setError('Photo storage is full. Remove a photo before adding more.'); }
  }
  async function add(files:File[]) {
    if (!files.length || busy) return;
    if (files.length + state.photos.length > 8) { setError('Choose up to eight photos in total.'); return; }
    setBusy(true);
    try {
      const added:Photo[] = [];
      for (const file of files) added.push(await readPhoto(file));
      update({...collection,photos:[...collection.photos,...added],enabled:true});
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not open the selected photos.'); }
    finally { setBusy(false); }
  }
  return createPortal(<section ref={screen} tabIndex={-1} className="xbox-photos" role="dialog" aria-modal="true" aria-label="Photo Slideshow">
    <header><button onClick={()=>view('dashboard')}>Back to dashboard</button><h1>Photo Slideshow</h1><p>Choose photos for your Xbox dashboard background.</p></header>
    <div className="xbox-photo-preview">
      {photo ? <img src={photo.src} alt={photo.name}/> : <p>Add photos to start your slideshow.</p>}
    </div>
    <div className="xbox-photo-actions" onKeyDown={event=>{if(event.key!=='Escape')event.stopPropagation();}}>
      <label>Add photos <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple disabled={busy} onChange={e=>{const files=Array.from(e.currentTarget.files ?? []);e.currentTarget.value='';void add(files);}}/></label>
      <label><input type="checkbox" checked={state.enabled} disabled={busy||!photo} onChange={e=>update({...state,enabled:e.target.checked})}/> Use as dashboard background</label>
      <label><input type="checkbox" checked={state.rotate} disabled={busy||state.photos.length<2} onChange={e=>update({...state,rotate:e.target.checked})}/> Rotate every 6 seconds</label>
      {photo && <button disabled={busy} onClick={()=>setIndex((index+1)%state.photos.length)}>Next photo</button>}
      {photo && <button disabled={busy} onClick={()=>update({...state,photos:state.photos.filter((_,i)=>i!==index),enabled:state.enabled&&state.photos.length>1})}>Remove this photo</button>}
    </div>
    <p role="status">{error || (busy ? 'Preparing photos…' : `${state.photos.length} of 8 photos · Stored on this device · Esc to go back`)}</p>
  </section>,getPortalRoot());
}
