const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFile, execFileSync, spawn} = require('node:child_process');
const {randomBytes} = require('node:crypto');
const http = require('node:http');
const port = 38761;

function imageData(file) {
  try {
    if (!file || fs.statSync(file).size > 750000) return;
    const mime = {'.png':'png','.jpg':'jpeg','.jpeg':'jpeg','.webp':'webp'}[path.extname(file).toLowerCase()];
    if (mime) return `data:image/${mime};base64,${fs.readFileSync(file).toString('base64')}`;
  } catch {}
}

function macIcon(bundle) {
  const plist = path.join(bundle, 'Contents/Info.plist');
  const name = command('/usr/bin/plutil', ['-extract','CFBundleIconFile','raw',plist]);
  if (!name || name !== path.basename(name)) return;
  const file = path.join(bundle, 'Contents/Resources', path.extname(name) ? name : name + '.icns');
  if (!fs.existsSync(file)) return;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xboxblades-icon-'));
  try {
    const png = path.join(temp, 'icon.png');
    command('/usr/bin/sips', ['-s','format','png','-Z','256',file,'--out',png]);
    return imageData(png);
  } finally {
    fs.rmSync(temp, {recursive:true, force:true});
  }
}


const key = name => name.replace(/[™®©]/g, '').normalize('NFKD').replace(/\p{M}/gu, '')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const read = file => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } };
const entries = directory => { try { return fs.readdirSync(directory, {withFileTypes: true}); } catch { return []; } };
const command = (name, args) => {
  try { return execFileSync(name, args, {encoding: 'utf8', timeout: 10000, stdio: ['ignore','pipe','ignore']}).trim(); }
  catch { return ''; }
};

const archiveRoot = 'https://raw.githubusercontent.com/xenia-manager/x360db/main/';
const archiveIndexUrl = archiveRoot + 'games.json';
const xbox360Id = /^[0-9A-F]{8}$/i;

function indexXbox360(rows) {
  const byId = new Map();
  const byName = new Map();
  for (const item of rows) {
    if (!item || typeof item.title !== 'string' || typeof item.id !== 'string' || !xbox360Id.test(item.id)) continue;
    const id = item.id.toUpperCase();
    const title = key(item.title);
    if (!title) continue;
    byId.set(id, item);
    const matches = byName.get(title) ?? new Map();
    matches.set(id, item);
    byName.set(title, matches);
  }
  return {byId, byName};
}

async function loadXbox360Index(cache) {
  const parse = value => {
    try {
      const rows = JSON.parse(value);
      if (Array.isArray(rows) && rows.length) return rows;
    } catch {}
    return [];
  };
  const previous = parse(read(cache));
  if (previous.length && Date.now() - fs.statSync(cache).mtimeMs < 7 * 86400000) {
    return indexXbox360(previous);
  }
  try {
    const response = await fetch(archiveIndexUrl, {signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw Error('HTTP ' + response.status);
    const rows = parse(await response.text());
    if (!rows.length) throw Error('Catalog is empty');
    try {
      fs.mkdirSync(path.dirname(cache), {recursive:true});
      fs.writeFileSync(cache, JSON.stringify(rows));
    } catch {}
    console.log(`Xbox 360 catalog loaded (${rows.length} entries).`);
    return indexXbox360(rows);
  } catch {
    console.warn(previous.length ? 'Using the cached Xbox 360 catalog.' :
      'Xbox 360 catalog unavailable. Using other artwork sources.');
    return indexXbox360(previous);
  }
}

function findCover(game, catalog, archive = indexXbox360([])) {
  const byId = catalog.filter(item => game.steamId && item.steamIds?.includes(game.steamId));
  const matches = byId.length ? byId : catalog.filter(item =>
    item.names?.some(name => key(name) === key(game.name)));
  if (matches.length > 1) return {};
  const match = matches[0];
  if (match?.xbox360) return {cover: match.xbox360, edition: 'Xbox 360'};

  // Prefer a verified edition mapping. Otherwise require one exact title.
  // Keep years and sequel numbers so same-name releases cannot be guessed.
  const exact = archive.byName.get(key(game.name));
  const legacy = match?.xbox360Id ? archive.byId.get(match.xbox360Id) :
    exact?.size === 1 ? exact.values().next().value : undefined;
  if (legacy?.boxart) {
    return {cover: archiveRoot + `titles/${legacy.id.toUpperCase()}/artwork/boxart.jpg`, edition:'Xbox 360'};
  }
  if (match?.xbox) return {cover: match.xbox, edition: 'Xbox'};
  return {};
}

function steamGames(roots) {
  const libraries = new Set(roots);
  for (const root of roots) {
    const vdf = read(path.join(root, 'steamapps', 'libraryfolders.vdf'));
    for (const match of vdf.matchAll(/"path"\s+"((?:[^"\\]|\\.)+)"/gi)) {
      libraries.add(match[1].replace(/\\\\/g, '\\'));
    }
  }
  const games = [];
  for (const root of libraries) {
    const apps = path.join(root, 'steamapps');
    for (const file of entries(apps)) {
      const match = /^appmanifest_(\d+)\.acf$/.exec(file.name);
      if (!match || !file.isFile()) continue;
      const manifest = read(path.join(apps, file.name));
      const name = /"name"\s+"((?:[^"\\]|\\.)+)"/i.exec(manifest)?.[1];
      const directory = /"installdir"\s+"([^"]+)"/i.exec(manifest)?.[1];
      if (!name || !directory || directory !== path.basename(directory)) continue;
      if (!fs.existsSync(path.join(apps, 'common', directory))) continue;
      if (/dedicated server|steamworks common redistributables|proton|steam linux runtime/i.test(name)) continue;
      const steamId = match[1];
      const artwork = roots.map(base => {
        const cache = path.join(base, 'appcache/librarycache');
        const folder = path.join(cache, steamId);
        const cached = entries(folder).find(file => /^library_600x900\.(?:jpg|png|webp)$/i.test(file.name));
        return imageData(cached && path.join(folder, cached.name)) ||
          imageData(path.join(cache, steamId + '_library_600x900.jpg'));
      }).find(Boolean);
      games.push({name: name.replace(/\\"/g, '"'), steamId, artwork, launch: {type:'steam', value:steamId}});
    }
  }
  return games;
}

function detect(catalog, gameFolders, archive) {
  const home = os.homedir();
  const env = process.env;
  const known = name => archive.byName.has(key(name)) ||
    catalog.some(item => item.names?.some(alias => key(alias) === key(name)));
  const games = [];
  let steamRoots;
  if (process.platform === 'darwin') {
    steamRoots = [path.join(home, 'Library/Application Support/Steam')];
    for (const root of ['/Applications', path.join(home, 'Applications')]) {
      for (const app of entries(root)) {
        if (!app.isDirectory() || !app.name.endsWith('.app')) continue;
        const name = app.name.slice(0, -4);
        const category = command('/usr/bin/plutil', ['-extract', 'LSApplicationCategoryType', 'raw',
          path.join(root, app.name, 'Contents/Info.plist')]);
        if (known(name) || /^public\.app-category\.(?:games|[\w-]+-games)$/.test(category)) {
          const bundle = path.join(root, app.name);
          games.push({name, launch:{type:'mac-app', value:bundle}});
        }
      }
    }
  } else if (process.platform === 'win32') {
    const steamPath = command('reg.exe', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'])
      .match(/SteamPath\s+REG_SZ\s+(.+)/i)?.[1];
    steamRoots = [steamPath, path.join(env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam')].filter(Boolean);
    const manifests = path.join(env.ProgramData || 'C:\\ProgramData', 'Epic/EpicGamesLauncher/Data/Manifests');
    for (const item of entries(manifests)) {
      if (!item.name.endsWith('.item')) continue;
      try {
        const data = JSON.parse(read(path.join(manifests, item.name)));
        if (!data.bIsIncompleteInstall && data.DisplayName && data.InstallLocation && fs.existsSync(data.InstallLocation)) {
          const exe = path.resolve(data.InstallLocation, data.LaunchExecutable || '');
          const relative = path.relative(path.resolve(data.InstallLocation), exe);
          const launch = relative && !relative.startsWith('..') && !path.isAbsolute(relative) &&
            /\.exe$/i.test(exe) && fs.existsSync(exe) ? {type:'executable', value:exe} : undefined;
          games.push({name: data.DisplayName, launch});
        }
      } catch {}
    }
    const installed = command('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      "Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | ForEach-Object { $_.DisplayName }"]);
    for (const name of installed.split(/\r?\n/)) if (known(name)) games.push({name});
  } else if (process.platform === 'linux') {
    steamRoots = [
      path.join(home, '.steam/steam'), path.join(home, '.local/share/Steam'),
      path.join(home, '.var/app/com.valvesoftware.Steam/data/Steam'),
    ];
    const roots = [env.XDG_DATA_HOME || path.join(home, '.local/share'),
      ...(env.XDG_DATA_DIRS || '/usr/local/share:/usr/share').split(':'), '/var/lib/flatpak/exports/share',
      path.join(home, '.local/share/flatpak/exports/share')];
    for (const root of roots) {
      for (const item of entries(path.join(root, 'applications'))) {
        if (!item.name.endsWith('.desktop')) continue;
        const desktop = read(path.join(root, 'applications', item.name)).split(/^\[(?!Desktop Entry\])/m)[0];
        const name = /^Name=(.+)$/m.exec(desktop)?.[1]?.trim();
        const categories = /^Categories=(.*)$/m.exec(desktop)?.[1]?.split(';') ?? [];
        if (name && categories.includes('Game') && !/^Hidden=true$/m.test(desktop)) games.push({name, artwork:imageData(/^Icon=(\/[^\r\n]+)$/m.exec(desktop)?.[1]),
          launch:{type:'linux-desktop', value:path.join(root, 'applications', item.name)}});
      }
    }
  } else {
    throw Error('This scanner supports macOS, Windows, and Linux.');
  }
  games.unshift(...steamGames(steamRoots));
  for (const folder of gameFolders) {
    const root = path.resolve(folder);
    if (!fs.statSync(root).isDirectory()) throw Error('Not a game folder: ' + folder);
    for (const entry of entries(root)) {
      if (!entry.name.startsWith('.') && (entry.isDirectory() || /\.(?:exe|appimage)$/i.test(entry.name))) {
        const file = path.join(root, entry.name);
        let launch;
        if (process.platform === 'darwin' && entry.isDirectory() && /\.app$/i.test(file)) launch = {type:'mac-app', value:file};
        if (entry.isFile() && ((process.platform === 'win32' && /\.exe$/i.test(file)) ||
            (process.platform === 'linux' && /\.appimage$/i.test(file)))) launch = {type:'executable', value:file};
        games.push({name: entry.name.replace(/\.(?:app|exe|appimage)$/i, ''), launch});
      }
    }
  }

  const result = new Map();
  for (const game of games) {
    if (typeof game.name !== 'string' || !key(game.name) || game.name.length > 160) continue;
    if (['steam', 'epic games launcher', 'lunar client', 'modrinth app', 'roblox studio', 'heroic games launcher'].includes(key(game.name))) continue;
    const identity = key(game.name);
    if (result.has(identity)) continue;
    const artwork = findCover(game, catalog, archive);
    const local = game.artwork || (game.launch?.type === 'mac-app' ? macIcon(game.launch.value) : undefined);
    if (!artwork.cover && local) Object.assign(artwork, {cover:local, edition:'Installed artwork'});
    else if (local) artwork.fallbackCover = local;
    result.set(identity, {id:identity, name:game.name, ...artwork, launch:game.launch});
  }
  return [...result.values()].sort((a,b) => a.name.localeCompare(b.name));
}

function launchGame(target, done) {
  const {type, value} = target;
  if (type === 'steam') {
    const uri = 'steam://rungameid/' + value;
    const launcher = {darwin:'/usr/bin/open', win32:'explorer.exe', linux:'xdg-open'}[process.platform];
    execFile(launcher, [uri], done);
  } else if (type === 'mac-app') {
    execFile('/usr/bin/open', [value], done);
  } else if (type === 'linux-desktop') {
    execFile('gio', ['launch', value], done);
  } else if (type === 'executable') {
    const child = spawn(value, [], {cwd:path.dirname(value), detached:true, stdio:'ignore'});
    child.once('error', done);
    child.once('spawn', () => { child.unref(); done(null); });
  }
}

function launchServer(games, token) {
  const launches = new Map(games.filter(game => game.launch).map(game => [game.id, game.launch]));
  return http.createServer((request, response) => {
    if (request.headers.host !== `127.0.0.1:${port}` ||
        request.headers.origin !== 'https://xpui.app.spotify.com' ||
        request.url !== '/launch') {
      response.writeHead(403).end();
      return;
    }
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
    response.setHeader('Vary', 'Origin');
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Xbox-Game');
      response.setHeader('Access-Control-Allow-Private-Network', 'true');
      response.writeHead(204).end();
      return;
    }
    const target = launches.get(request.headers['x-xbox-game']);
    if (request.method !== 'POST' || request.headers.authorization !== 'Bearer ' + token || !target) {
      response.writeHead(403).end();
      return;
    }
    launchGame(target, error => response.writeHead(error ? 502 : 204).end());
  });
}

async function main(args) {
  const folders = [];
  let output;
  let apply = false;
  let serve = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') apply = true;
    else if (args[i] === '--serve') { serve = true; apply = true; }
    else if (args[i] === '--folder' && args[i+1]) folders.push(args[++i]);
    else if (args[i] === '--output' && args[i+1]) output = path.resolve(args[++i]);
    else throw Error('Usage: node refresh.cjs [--folder "Games folder"] [--output games.json | --apply | --serve]');
  }
  const catalog = JSON.parse(read(path.join(__dirname, 'covers.json')));

  if (output && apply) throw Error('Choose --output or --apply.');
  if (!output) {
    const config = command('spicetify', ['-c']);
    if (!config || !fs.existsSync(config)) throw Error('Spicetify config unavailable. Run Spicetify from a fresh terminal first.');
    const theme = path.join(path.dirname(config), 'Themes', 'XboxBlades');
    if (!fs.existsSync(path.join(theme, 'theme.js'))) throw Error('Install the XboxBlades theme first.');
    output = path.join(theme, 'assets', 'xboxblades', 'desktop-games.json');
  }
  const cache = path.join(os.homedir(), '.cache', 'xboxblades', 'xbox360-index.json');
  const archive = await loadXbox360Index(cache);
  const games = detect(catalog, folders, archive);
  fs.mkdirSync(path.dirname(output), {recursive: true});
  const token = serve ? randomBytes(24).toString('hex') : undefined;
  const publicGames = games.map(({launch, id, ...game}) => ({
    ...game, launchId: token && launch ? Buffer.from(id).toString('base64url') : undefined,
  }));
  const temporary = output + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temporary, JSON.stringify({games:publicGames, token}, null, 2) + '\n');
    fs.renameSync(temporary, output);
  } finally {
    fs.rmSync(temporary, {force: true});
  }
  console.log(`Found ${games.length} games. Saved ${output}`);
  if (serve) {
    const targets = games.map(game => ({...game, id:Buffer.from(game.id).toString('base64url')}));
    const server = launchServer(targets, token);
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => {
      try {
        applyTheme();
        console.log('Game launching is ready. Keep this terminal open while using My Games.');
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
        server.close();
      }
    });
  } else if (apply) applyTheme();
}

function applyTheme() {
    execFileSync('spicetify', ['config', 'overwrite_assets', '1'], {stdio: 'inherit'});
    execFileSync('spicetify', ['apply'], {stdio: 'inherit'});
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = {findCover, indexXbox360, steamGames};
