import React, {useEffect, useRef, useState} from 'react';
import {request, view} from './bridge';
import {Toolbar} from './toolbar';

export function Lyrics() {
  const [track, setTrack] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const currentLine = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let active = true;
    const poll = () => request('state').then(state => {
      if (active) setTrack(state);
    }).catch(() => {});
    poll();
    const timer = setInterval(poll, 300);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const uri = track?.uri;
  useEffect(() => {
    let active = true;
    setResult(null);
    setError('');
    if (uri) request('lyrics', {uri}).then(data => {
      if (active) setResult({uri, ...data});
    }).catch(error => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [uri]);

  const lyrics = result?.uri === uri ? result : null;
  const activeIndex = lyrics?.synced ? lyrics.lines.findLastIndex(
    (line: any) => line.start <= track.position
  ) : -1;
  useEffect(() => {
    currentLine.current?.scrollIntoView({block:'center', behavior:'smooth'});
  }, [activeIndex, uri]);

  return <section className="xbox-lyrics" aria-label="Xbox Lyrics">
    <Toolbar/>
    <header>
      <div><small>NOW PLAYING · LYRICS</small><h1>{track?.title || 'Lyrics'}</h1><p>{track?.artist}</p></div>
      <button onClick={() => view('visualizer')}>Back to visuals</button>
    </header>
    <div className="xbox-lyrics-lines">
      {lyrics?.lines.length ? lyrics.lines.map((line: any, index: number) =>
        <p key={index} ref={index === activeIndex ? currentLine : undefined}
           aria-current={index === activeIndex ? 'true' : undefined}>{line.words}</p>
      ) : <p>{error || (!uri ? 'Play a song to see its lyrics.' : lyrics ? 'Spotify has no lyrics for this track.' : 'Loading lyrics…')}</p>}
      {lyrics?.provider && <small>Lyrics provided by {lyrics.provider}</small>}
    </div>
    <footer><button onClick={() => request('native-lyrics').catch(e => setError(e.message))}>Open Spotify lyrics</button></footer>
  </section>;
}
