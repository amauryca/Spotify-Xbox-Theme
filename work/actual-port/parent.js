(function boot(){
 if(!window.Spicetify?.Player?.origin||!Spicetify.Platform?.History)return setTimeout(boot,300);
 if(window.__actualBlades)return;window.__actualBlades=true;
 let playbackQueue=[],queueIndex=-1;let frame=null,ready=false,nextView=null,analysis=null,trackUri=null,analysisRequest=0;
 const html=__DASHBOARD_HTML__;
 const hitStyle=document.createElement('style');hitStyle.textContent='body[data-xbox-startup] .body-drag-top,body[data-xbox-dashboard-open] .body-drag-top{-webkit-app-region:no-drag!important;display:none!important;pointer-events:none!important}#xbox-dashboard-frame{-webkit-app-region:no-drag!important;pointer-events:auto!important}';document.head.append(hitStyle);
 const titleStrip=document.createElement('div');titleStrip.style.cssText='position:fixed;top:0;left:0;right:0;height:32px;background:linear-gradient(#edf1e4,#c4cfb8);z-index:2147483000;-webkit-app-region:drag;display:none';document.body.append(titleStrip);

 const send=(type,payload={})=>{if(frame?.contentWindow)frame.contentWindow.postMessage({channel:'xbox-spotify-event',type,...payload},'*')};
 function open(view){nextView=typeof view==='string'?view:null;if(frame){if(ready&&nextView){send('view',{view:nextView});nextView=null;}return;}ready=false;document.body.dataset.xboxDashboardOpen='true';titleStrip.style.display='block';frame=document.createElement('iframe');frame.id='xbox-dashboard-frame';frame.title='Xbox 360 dashboard';frame.allow='microphone; fullscreen; gamepad';frame.allowFullscreen=true;frame.style.cssText='position:fixed;inset:32px 0 0;width:100%;height:calc(100% - 32px);border:0;z-index:2147483000;background:#426f24';frame.srcdoc=html;document.body.append(frame);if(!document.getElementById('xbox-startup'))frame.focus();}
 function hide(){delete document.body.dataset.xboxDashboardOpen;titleStrip.style.display='none';frame?.remove();frame=null;ready=false;analysis=null;++analysisRequest;}
 const normalize=rows=>rows.map(t=>t?.item?.data||t?.item||t?.data||t).map(t=>({uri:t.uri||t.entityUri||t.track?.uri,name:t.name||t.track?.name,artist:(t.artists?.items||t.artists||[]).map(a=>a.profile?.name||a.name||a.data?.profile?.name).filter(Boolean).join(', '),album:t.album?.name||t.albumOfTrack?.name||'',image:t.album?.images?.[0]?.url||t.albumOfTrack?.coverArt?.sources?.[0]?.url||''})).filter(t=>/^spotify:track:[a-zA-Z0-9]+$/.test(t.uri||''));
 async function search(query){
 if(typeof query!=='string'||!query.trim()||query.length>300)throw Error('Enter a song or artist, up to 300 characters.');
 const variables={searchTerm:query.trim(),offset:0,limit:20,numberOfTopResults:20,includeAudiobooks:false,includeAuthors:false,includePreReleases:false,includeAlbumPreReleases:false,includeEpisodeContentRatingsV2:false};
 let data;
 let definition=Spicetify.GraphQL?.Definitions?.searchTracks;if(!definition){Spicetify.Platform.History.push('/search');for(let attempt=0;attempt<50&&!definition;attempt++){await new Promise(resolve=>setTimeout(resolve,100));definition=Spicetify.GraphQL?.Definitions?.searchTracks;}}
 if(definition&&Spicetify.GraphQL?.Request){data=await Spicetify.GraphQL.Request(definition,variables);}
 else data=await Spicetify.CosmosAsync.post('https://api-partner.spotify.com/pathfinder/v1/query',{operationName:'searchTracks',variables,extensions:{persistedQuery:{version:1,sha256Hash:'b02683192a98dde7966b5e6655a79eeb62713eab703eda9902c932818dd52751'}}});
 const body=data?.body||data,rows=body?.data?.searchV2?.tracksV2?.items||body?.data?.searchV2?.tracks?.items;
 if(Array.isArray(rows))return normalize(rows);
 throw Error('Spotify search could not complete: '+(body?.errors?.[0]?.message||body?.message||'unrecognized response'));
 }

 async function profile(){const api=Spicetify.Platform.UserAPI;let u=api?.user||api?._user;try{if(!u&&api?.getUser)u=await api.getUser()}catch{}if(!u){try{const r=await Spicetify.CosmosAsync.get('https://api.spotify.com/v1/me');if(!r?.error)u=r}catch{}}u=u?.user||u;const widget=document.querySelector('[data-testid="user-widget-link"],[data-testid="user-widget-button"]');return{name:u?.displayName||u?.display_name||u?.name||u?.username||widget?.getAttribute('aria-label')||widget?.getAttribute('title')||'Spotify listener',image:u?.imageUrl||u?.image_url||u?.images?.[0]?.url||widget?.querySelector('img')?.src||''};}
 async function library(uri,offset=0){const api=Spicetify.Platform.RootlistAPI;if(!api?.getContents)throw Error('Spotify library is unavailable.');const data=await api.getContents({...uri?{uri}:{},offset,limit:100});const rows=data?.items||data?.rows||[];return {items:rows.map(r=>({uri:r.uri||r.link,name:r.name||r.metadata?.name||'Untitled',kind:r.type==='folder'||String(r.uri).includes(':folder:')?'folder':'playlist',image:r.images?.[0]?.url||r.image?.url||r.metadata?.picture||''})).filter(r=>r.kind==='folder'||/^spotify:playlist:/.test(r.uri||'')),hasMore:rows.length===100,offset:offset+rows.length};}
 async function playlist(uri,offset=0){if(!/^spotify:playlist:[a-zA-Z0-9]+$/.test(uri||''))throw Error('Invalid playlist');const data=await Spicetify.Platform.PlaylistAPI.getContents(uri,{offset,limit:100});const rows=data?.items||data?.rows||[];return {items:normalize(rows.map(r=>r.track||r)),hasMore:rows.length===100,offset:offset+rows.length};}
 async function state(){const p=Spicetify.Player,item=p.data?.item,uri=item?.uri;if(uri!==trackUri){trackUri=uri;analysis=null;const token=++analysisRequest;if(uri)Promise.resolve(Spicetify.getAudioData?.(uri)).then(d=>{if(token===analysisRequest&&d?.segments?.length)analysis=d}).catch(()=>{});}let bands=null;if(analysis){const t=p.getProgress()/1000,s=analysis.segments;let l=0,h=s.length-1;while(l<h){let m=Math.ceil((l+h)/2);if(s[m].start<=t)l=m;else h=m-1;}const seg=s[l],within=Math.max(0,t-seg.start),peak=seg.loudness_max_time||.08,duration=seg.duration||.2,level=within<peak?(seg.loudness_start??-30)+((seg.loudness_max??-15)-(seg.loudness_start??-30))*within/peak:(seg.loudness_max??-15)+((seg.loudness_end??seg.loudness_start??-30)-(seg.loudness_max??-15))*Math.min(1,(within-peak)/Math.max(.02,duration-peak)),amp=Math.min(1,Math.pow(10,level/40));bands=Array.from({length:28},(_,i)=>Math.min(1,amp*(.25+.75*(seg.pitches?.[i%12]??.4))*(1-i/65)));}return{uri,title:item?.name||item?.metadata?.title||'Choose a song',artist:item?.artists?.map(a=>a.name).join(', ')||item?.metadata?.artist_name||'',paused:!p.isPlaying(),position:p.getProgress(),duration:p.getDuration(),bands,audioMode:bands?'Track analysis · approximate bands, not a live waveform':'Ambient · no audio analysis available'};}
 async function playTrack(uri,queue){if(!/^spotify:track:[a-zA-Z0-9]+$/.test(uri||''))throw Error('Invalid Spotify track');await Spicetify.Player.playUri(uri);for(let i=0;i<40&&Spicetify.Player.data?.item?.uri!==uri;i++)await new Promise(r=>setTimeout(r,100));if(Spicetify.Player.data?.item?.uri!==uri)throw Error('Spotify has not switched songs. Check your active device.');if(Array.isArray(queue)){playbackQueue=queue.filter(u=>/^spotify:track:[a-zA-Z0-9]+$/.test(u)).slice(0,500);}queueIndex=playbackQueue.indexOf(uri);return{uri};}
 async function step(delta){const p=Spicetify.Player,current=p.data?.item?.uri;queueIndex=playbackQueue.indexOf(current);if(delta<0&&p.getProgress()>3000){p.seek(0);return{uri:current};}if(queueIndex>=0){const index=queueIndex+delta;if(index<0){p.seek(0);return{uri:current};}if(index>=playbackQueue.length)throw Error('You reached the end of this song list. Find more music to continue.');return await playTrack(playbackQueue[index]);}await (delta>0?p.next():p.back());for(let i=0;i<30&&p.data?.item?.uri===current;i++)await new Promise(r=>setTimeout(r,100));if(p.data?.item?.uri===current)throw Error('Spotify has no '+(delta>0?'next':'previous')+' track available. Choose a song from search or a playlist.');return{uri:p.data?.item?.uri};}
 function settings(){const p=Spicetify.Player;const read=fn=>{try{const value=fn?.();return value===undefined?null:value}catch{return null}};return{startupAvailable:typeof window.__xboxPlayStartup==='function',volume:read(p.getVolume),shuffle:read(p.getShuffle),repeat:read(p.getRepeat),startup:localStorage.getItem('xbox-startup-enabled')!=='false',startupSound:localStorage.getItem('xbox-startup-sound')!=='false'};}
 async function updateSettings(key,value){const p=Spicetify.Player;if(key==='volume'&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1)await p.setVolume(value);else if(key==='shuffle'&&typeof value==='boolean')await p.setShuffle(value);else if(key==='repeat'&&[0,1,2].includes(value))await p.setRepeat(value);else if(['startup','startupSound'].includes(key)&&typeof value==='boolean')localStorage.setItem(key==='startup'?'xbox-startup-enabled':'xbox-startup-sound',String(value));else throw Error('Unsupported setting');return settings();}
 const preferenceSections = {
   audio: ['desktop.settings.musicQuality', 'Audio quality', 'Music quality'],
   playback: ['desktop.settings.playback', 'Playback'],
   autoplay: ['desktop.settings.autoplay', 'Autoplay'],
   transitions: ['web-player.settings.track-transitions.title', 'Track transitions', 'Crossfade', 'Playback'],
   language: ['desktop.settings.language', 'Language'],
   display: ['settings.display', 'Display preferences', 'Display'],
   storage: ['desktop.settings.storage', 'Storage', 'Downloads'],
   startup: ['desktop.settings.startupAndWindowBehavior', 'Startup and window behavior'],
 };
 function openPreferences(section) {
   const labels = preferenceSections[section];
   hide();
   Spicetify.Platform.History.push('/preferences');
   if (!labels) return;
   let attempts = 0;
   const locate = () => {
     if (frame || ++attempts > 50) return;
     const [key, ...fallbacks] = labels;
     let translated;
     try { translated = Spicetify.Locale?.get?.(key); } catch {}
     const names = [translated, ...fallbacks].filter(Boolean).map(label => label.toLowerCase());
     const headings = document.querySelectorAll('h2, h3, label');
     const visible = Array.from(headings).filter(node => node.getClientRects().length);
     const target = names.map(name => visible.find(node => node.textContent.trim().toLowerCase() === name)).find(Boolean);
     if (!target) { setTimeout(locate, 120); return; }
     target.style.scrollMarginTop = '24px';
     target.scrollIntoView({block:'start'});
     target.animate?.([{backgroundColor:'#83c64f55'},{backgroundColor:'transparent'}], {duration:1800});
   };
   setTimeout(locate, 200);
 }
 async function getLyrics(uri) {
   const item = Spicetify.Player.data?.item;
   const trackId = /^spotify:track:([a-zA-Z0-9]+)$/.exec(uri || '')?.[1];
   if (!trackId || item?.uri !== uri) return {lines:[]};
   const image = item.metadata?.image_xlarge_url || item.metadata?.image_url || 'https://i.scdn.co/image/ab67616d0000b273';
   const path = '/color-lyrics/v2/track/' + trackId + '/image/' + encodeURIComponent(image) + '?format=json&vocalRemoval=false';
   try {
     const response = await Spicetify.CosmosAsync.get('https://spclient.wg.spotify.com' + path);
     const lyrics = (response?.body || response)?.lyrics;
     if (!Array.isArray(lyrics?.lines)) return {lines:[]};
     return {synced:lyrics.syncType === 'LINE_SYNCED', provider:lyrics.providerDisplayName || lyrics.provider,
       lines:lyrics.lines.filter(line => typeof line.words === 'string').map(line => ({words:line.words, start:Number(line.startTimeMs) || 0}))};
   } catch (error) {
     if (Number(error?.status || error?.code) === 404) return {lines:[]};
     throw Error('Lyrics could not load here. Open Spotify lyrics to check this song.');
   }
 }
 window.addEventListener('message',async e=>{if(e.source!==frame?.contentWindow||e.data?.channel!=='xbox-spotify-request')return;const {id,action,payload={}}=e.data;try{let value;switch(action){case'ready':ready=true;value=true;if(nextView){const v=nextView;setTimeout(()=>send('view',{view:v}),0);nextView=null;}break;case'replay-startup':window.__xboxPlayStartup?.();value=true;break;case'settings':value=settings();break;case'settings-update':value=await updateSettings(payload.key,payload.value);break;case'native-settings':openPreferences(payload.section);return;case'lyrics':value=await getLyrics(payload.uri);break;case'native-lyrics':hide();Spicetify.Platform.History.push('/lyrics');return;case'profile':value=await profile();break;case'library':if(payload.uri&&!/^spotify:folder:/.test(payload.uri))throw Error('Invalid folder');value=await library(payload.uri,payload.offset||0);break;case'playlist':value=await playlist(payload.uri,payload.offset||0);break;case'search':value=await search(payload.query);break;case'play':value=await playTrack(payload.uri,payload.queue);break;case'state':value=await state();break;case'previous':value=await step(-1);break;case'next':value=await step(1);break;case'toggle':{const playing=Spicetify.Player.isPlaying();await Spicetify.Player.togglePlay();for(let i=0;i<25&&Spicetify.Player.isPlaying()===playing;i++)await new Promise(r=>setTimeout(r,100));if(Spicetify.Player.isPlaying()===playing)throw Error('Spotify did not change playback. Check your active device.');value={paused:!Spicetify.Player.isPlaying()};break;}case'native-search':hide();Spicetify.Platform.History.push('/search');return;case'dashboard':send('view',{view:'dashboard'});value=true;break;default:throw Error('Unknown dashboard action');}e.source.postMessage({channel:'xbox-spotify-response',id,value},'*')}catch(error){e.source?.postMessage({channel:'xbox-spotify-response',id,error:error?.message||String(error)},'*')}});
 // A small, isolated return control is the only element outside the dashboard iframe.
 const host=document.createElement('div');host.style.cssText='position:fixed;right:18px;bottom:108px;z-index:2147483100';const shadow=host.attachShadow({mode:'open'});shadow.innerHTML='<style>button{font:14px Arial;background:#dce9d1;color:#203318;border:1px solid #8da57c;border-radius:22px;padding:10px 18px;cursor:pointer}button:focus-visible{outline:3px solid #8ddd51}</style>';const b=document.createElement('button');b.textContent='Xbox Dashboard';b.type='button';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open('dashboard')});shadow.append(b);document.body.append(host);setInterval(()=>{host.style.display=frame?'none':'block'},300);open();
})();
