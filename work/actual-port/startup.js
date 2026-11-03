(function startup(){
 if(window.__xboxStartupShown)return;window.__xboxStartupShown=true;

 const mount=()=>{
 if(document.getElementById('xbox-startup'))return;const cover=document.createElement('div');cover.id='xbox-startup';cover.setAttribute('role','dialog');cover.setAttribute('aria-label','Xbox startup animation');cover.tabIndex=-1;cover.style.cssText='position:fixed;inset:0;background:white;z-index:2147483600;display:grid;place-items:center;transition:opacity 480ms ease;-webkit-app-region:no-drag';
 const video=document.createElement('video');video.src=__STARTUP_VIDEO__;video.playsInline=true;video.preload='auto';video.style.cssText='width:100%;height:100%;object-fit:contain;position:absolute;inset:0;background:white;-webkit-app-region:no-drag';video.volume=.65;try{video.muted=localStorage.getItem('xbox-startup-sound')==='false'}catch{}
 const buttons=document.createElement('div');buttons.style.cssText='position:absolute;bottom:24px;right:24px;display:flex;gap:10px;-webkit-app-region:no-drag';
 const sound=document.createElement('button'),skip=document.createElement('button');for(const b of [sound,skip])b.style.cssText='font:15px Arial;padding:10px 18px;border:1px solid #92ac78;border-radius:22px;background:#edf5e4;color:#203718;cursor:pointer;-webkit-app-region:no-drag';sound.textContent=video.muted?'Enable sound':'Mute intro';skip.textContent='Skip intro';
 let timer,closing=false;const close=()=>{if(closing)return;closing=true;clearTimeout(timer);document.removeEventListener('keydown',key,true);video.pause();cover.style.opacity='0';cover.style.pointerEvents='none';
 setTimeout(()=>{cover.remove();document.body.removeAttribute('data-xbox-startup');document.getElementById('xbox-dashboard-frame')?.focus();},480);};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'Enable sound':'Mute intro';video.play().catch(()=>{})};skip.onclick=close;video.onended=close;video.onerror=close;
 cover.append(video,buttons);buttons.append(sound,skip);document.body.dataset.xboxStartup='true';document.body.append(cover);cover.focus();document.addEventListener('keydown',key,true);timer=setTimeout(close,30000);
 video.play().catch(()=>{video.muted=true;sound.textContent='Enable sound';video.play().catch(()=>{sound.textContent='Play intro with sound';sound.onclick=()=>{video.muted=false;video.play().then(()=>{sound.textContent='Mute intro'}).catch(close)}})});
 };
 window.__xboxPlayStartup=mount;let enabled=true;try{enabled=localStorage.getItem('xbox-startup-enabled')!=='false'}catch{}if(enabled){if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});}
})();
