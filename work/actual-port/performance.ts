export function quality(){try{return localStorage.getItem('xbox-quality')||'fast'}catch{return 'fast'}}
export function renderRatio(){const q=quality();return Math.min(devicePixelRatio||1,q==='sharp'?1.5:q==='balanced'?1:.75)}
export function targetFPS(){try{return localStorage.getItem('xbox-target-fps')==='60'?60:120}catch{return 120}}
