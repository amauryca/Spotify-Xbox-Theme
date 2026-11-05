import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {BladeChromeBand} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/BladeChromeBand';
import {bladeHeaderClass, bladeTitleClass, bladeFooterClass} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/BladePanel';
import {ButtonGlyph} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/ButtonGlyph';
import type {MenuScreenProps} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/MenuListItem';

type Game = {name: string; cover?: string; fallbackCover?: string; edition?: 'Xbox' | 'Xbox 360' | 'Installed artwork'; launchId?: string};

function coverUrl(value?: string) {
  if (typeof value !== 'string') return;
  if (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return;
    if (url.hostname === 'store-images.s-microsoft.com') return url.href;
    if (url.hostname === 'raw.githubusercontent.com' &&
        /^\/xenia-manager\/x360db\/main\/titles\/[0-9A-F]{8}\/artwork\/boxart\.jpg$/.test(url.pathname)) return url.href;
  } catch {}
}

function CoverArt({game, preview = false}: {game: Game; preview?: boolean}) {
  const [failed, setFailed] = useState<string>();
  const preferred = coverUrl(game.cover);
  const fallback = coverUrl(game.fallbackCover);
  const cover = preferred && failed === undefined ? preferred : fallback && failed !== fallback ? fallback : undefined;
  const label = cover === preferred ? game.edition || 'Xbox' : 'installed';
  return cover ? <img src={cover} alt={preview ? `${game.name} ${label} cover` : ''}
    referrerPolicy="no-referrer" onError={() => setFailed(cover)}/> :
    <div className="desktop-game-placeholder" aria-hidden="true">X</div>;
}

export function MyGamesScreen({onClose}: MenuScreenProps) {
  const firstRow = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(0);
  const [games, setGames] = useState<Game[]>([]);
  const [token, setToken] = useState('');
  const [launchMessage, setLaunchMessage] = useState('');
  const launchPending = useRef(false);
  const [status, setStatus] = useState('Loading detected games…');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(new URL('xboxblades/desktop-games.json', document.baseURI),
          {cache:'no-store', signal:controller.signal});
        if (!response.ok) throw Error();
        const data = await response.json();
        if (!Array.isArray(data.games)) throw Error();
        const detected = data.games.filter((game: Game) => game && typeof game.name === 'string' && game.name.trim());
        if (controller.signal.aborted) return;
        setGames(detected);
        setToken(typeof data.token === "string" ? data.token : "");
        setStatus(detected.length ? `${detected.length} games detected` :
          'No games detected. Run the companion with an additional game folder to check it.');
      } catch {
        if (!controller.signal.aborted) setStatus('Run the XboxBlades desktop games companion to detect your installed games.');
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => { firstRow.current?.focus(); }, [games]);

  async function launch(item: Game) {
    if (launchPending.current) return;
    if (!token || !item.launchId) {
      setLaunchMessage('No supported launcher is ready for this game.');
      return;
    }
    launchPending.current = true;
    setLaunchMessage(`Opening ${item.name}…`);
    try {
      const response = await fetch('http://127.0.0.1:38761/launch', {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`, 'X-Xbox-Game': item.launchId},
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw Error();
      setLaunchMessage(`Launch requested for ${item.name}.`);
    } catch {
      setLaunchMessage('Could not open the game. Check that the desktop companion is running.');
    } finally {
      launchPending.current = false;
    }
  }

  const game = games[selected];
  const slot = document.querySelector<HTMLElement>('[data-games-panel-slot]');
  if (!slot) return null;
  return createPortal(
    <section className="desktop-games" role="dialog" aria-label="My Games">
        <BladeChromeBand edge="top" className={bladeHeaderClass}>
          <h1 className={bladeTitleClass}>Select a Game</h1>
        </BladeChromeBand>
        <div className="desktop-game-content">
          <div className="desktop-game-list" data-nav-list="column" aria-label="Detected games">
            {!games.length && <p role="status">{status}</p>}
            {games.map((item, index) => <button type="button" key={item.name} data-nav-item
              ref={index === 0 ? firstRow : undefined} className="desktop-game-row"
              aria-pressed={index === selected} onClick={event => {
                setSelected(index);
                if (event.detail === 0) void launch(item);
              }} onDoubleClick={() => void launch(item)}
              onFocus={() => setSelected(index)}>
              <span className="desktop-game-thumb"><CoverArt game={item}/></span>
              <span className="desktop-game-title">{item.name}</span>
              <small>{item.edition || 'Desktop'}</small>
            </button>)}
          </div>
          {game && <aside className="desktop-game-detail" aria-label="Selected game">
            <div className="desktop-game-preview"><CoverArt key={game.name} game={game} preview/></div>
            <h2>{game.name}</h2>
            <p>{game.edition ? `${game.edition === 'Installed artwork' ? 'Installed artwork' : game.edition + ' cover'}` : 'No matching Xbox cover'}</p>
            <small>Installed on this computer</small>
          </aside>}
        </div>
        <BladeChromeBand edge="bottom" className={bladeFooterClass + " desktop-game-footer"}>
          {games.length > 0 && <span role="status">{status} · {selected + 1} of {games.length}</span>}
          {game?.launchId && <button type="button" onClick={() => void launch(game)}>Open game <ButtonGlyph letter="A" sizePx={28}/></button>}
          <button type="button" onClick={onClose} autoFocus={!games.length}>Back <ButtonGlyph letter="B"/></button>
        </BladeChromeBand>
        {launchMessage && <p className="desktop-game-message" role="status">{launchMessage}</p>}
    </section>,
    slot,
  );
}
