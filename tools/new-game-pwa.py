#!/usr/bin/env python3
"""Make a game folder (or the menu) its own installable PWA.

  python3 tools/new-game-pwa.py memory --name "הזיכרון של פיקאצ'ו" --short "זיכרון" --emoji 🃏 --colors "#66bb6a,#00897b"
  python3 tools/new-game-pwa.py --all          # refresh every app (run after editing ANY game, before committing)

For each app folder it writes/refreshes:
  manifest.webmanifest  own id / scope / start_url (= the folder), Hebrew, rtl, standalone
  icons/                icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
                        (only if missing or --icons; drawn from an emoji with Pillow + Noto Color Emoji)
  pwa.js                copy of tools/templates/pwa.js (SW registration + install button/overlay)
  sw.js                 from tools/templates/sw.js with a content-hash VERSION and the folder's file list
  index.html            <!-- PWA --> head block (manifest, theme-color, apple tags, pwa.js) – idempotent
and adds a tile to the root menu if the game isn't linked yet. The menu's sw.js also precaches every game,
so it is always regenerated too (that's why you run it after editing any game).
The game's start screen needs an element with data-pwa-slot (the install button goes inside it).
"""
import argparse, hashlib, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = '/omer-games/'           # GitHub Pages base path
TPL = os.path.join(ROOT, 'tools', 'templates')
EMOJI_FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
SKIP_DIRS = {'tools', '.git', '.github'}
MENU = '.'


def games():
    return sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)) and d not in SKIP_DIRS
                  and not d.startswith('.') and os.path.exists(os.path.join(ROOT, d, 'index.html')))


def app_files(folder):
    """Relative (to folder) list of files the app needs, excluding sw.js and sub-apps."""
    base = os.path.join(ROOT, folder)
    out = []
    for dp, dns, fns in os.walk(base):
        rel = os.path.relpath(dp, base)
        if folder == MENU and rel == '.':
            dns[:] = [d for d in dns if d == 'icons']  # menu: own files + icons; games added separately
        dns[:] = [d for d in dns if not d.startswith('.') and d not in SKIP_DIRS]
        for f in fns:
            if f in ('sw.js',) or f.startswith('.') or f.endswith(('.py', '.md')):
                continue
            out.append(os.path.normpath(os.path.join(rel, f)).replace(os.sep, '/'))
    return sorted(out)


def draw_icons(folder, emoji, colors):
    from PIL import Image, ImageDraw, ImageFont
    c1, c2 = [tuple(int(c.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)) for c in colors]
    font = ImageFont.truetype(EMOJI_FONT, 109)
    g = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(g).text((80, 80), emoji, font=font, embedded_color=True, anchor='mm')
    g = g.crop(g.getbbox())

    def make(size, rounded, art):
        bg = Image.new('RGBA', (size, size))
        d = ImageDraw.Draw(bg)
        for y in range(size):
            t = y / (size - 1)
            d.line([(0, y), (size, y)], fill=tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)) + (255,))
        if rounded:
            m = Image.new('L', (size, size), 0)
            ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * .22), fill=255)
            bg.putalpha(m)
        s = int(size * art)
        e = g.resize((s, int(s * g.height / g.width)) if g.width >= g.height else (int(s * g.width / g.height), s), Image.LANCZOS)
        bg.alpha_composite(e, ((size - e.width) // 2, (size - e.height) // 2))
        return bg
    d = os.path.join(ROOT, folder, 'icons')
    os.makedirs(d, exist_ok=True)
    make(192, True, .66).save(os.path.join(d, 'icon-192.png'))
    make(512, True, .66).save(os.path.join(d, 'icon-512.png'))
    make(512, False, .52).save(os.path.join(d, 'icon-maskable-512.png'))
    make(180, False, .62).convert('RGB').save(os.path.join(d, 'apple-touch-icon.png'))


def write_manifest(folder, name, short, colors, theme):
    scope = BASE if folder == MENU else BASE + folder + '/'
    path = os.path.join(ROOT, folder, 'manifest.webmanifest')
    old = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    m = {
        'id': scope,
        'name': name or old.get('name') or folder,
        'short_name': short or old.get('short_name') or name or folder,
        'description': old.get('description') or 'משחק לילדים בעברית – עובד גם בלי אינטרנט',
        'lang': 'he', 'dir': 'rtl',
        'start_url': scope + 'index.html',
        'scope': scope,
        'display': 'standalone',
        'orientation': 'any',
        'theme_color': theme or colors[1],
        'background_color': colors[0],
        'icons': [
            {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
        f.write('\n')
    return m


def patch_html(folder, m):
    p = os.path.join(ROOT, folder, 'index.html')
    h = open(p, encoding='utf-8').read()
    block = ('<!-- PWA -->\n'
             '<link rel="manifest" href="manifest.webmanifest">\n'
             f'<meta name="theme-color" content="{m["theme_color"]}">\n'
             '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n'
             '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
             '<meta name="apple-mobile-web-app-capable" content="yes">\n'
             '<meta name="mobile-web-app-capable" content="yes">\n'
             '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
             f'<meta name="apple-mobile-web-app-title" content="{m["short_name"]}">\n'
             '<script src="pwa.js" defer></script>\n'
             '<!-- /PWA -->')
    if '<!-- PWA -->' in h:
        h = re.sub(r'<!-- PWA -->.*?<!-- /PWA -->', lambda _: block, h, flags=re.S)
    else:
        h = h.replace('</head>', block + '\n</head>', 1)
    open(p, 'w', encoding='utf-8').write(h)
    if 'data-pwa-slot' not in h:
        print(f'  ! {folder}/index.html has no data-pwa-slot element – add <div data-pwa-slot></div> to its start screen')


def write_sw(folder, files, app):
    base = os.path.join(ROOT, folder)
    hsh = hashlib.sha1()
    for f in files:
        hsh.update(f.encode())
        hsh.update(open(os.path.join(base, f), 'rb').read())
    hsh.update(open(os.path.join(TPL, 'sw.js'), 'rb').read())
    lst = ['./'] + files
    sw = open(os.path.join(TPL, 'sw.js'), encoding='utf-8').read()
    sw = sw.replace('__APP__', app).replace('__VERSION__', hsh.hexdigest()[:10]).replace('__FILES__', json.dumps(lst, ensure_ascii=False, indent=2))
    open(os.path.join(base, 'sw.js'), 'w', encoding='utf-8').write(sw)


def add_tile(folder, name, emoji):
    p = os.path.join(ROOT, 'index.html')
    h = open(p, encoding='utf-8').read()
    if f'href="{folder}/' in h:
        return
    n = len(re.findall(r'class="game c\d', h))
    tile = f'<a class="game c{n % 4 + 1}" href="{folder}/index.html"><div class="icon">{emoji}</div><div class="name">{name}</div></a>'
    h = re.sub(r'(<!-- GAMES:.*?-->\n)', lambda mm: mm.group(1) + '    ' + tile + '\n', h, count=1, flags=re.S)
    open(p, 'w', encoding='utf-8').write(h)
    print('  + menu tile added')


def refresh(folder, a):
    app = 'menu' if folder == MENU else folder
    print(f'* {app}')
    old = {}
    mp = os.path.join(ROOT, folder, 'manifest.webmanifest')
    if os.path.exists(mp):
        old = json.load(open(mp, encoding='utf-8'))
    colors = a.colors.split(',') if a.colors else [old.get('background_color', '#ffcb05'), old.get('theme_color', '#3b4cca')]
    if a.icons or not os.path.exists(os.path.join(ROOT, folder, 'icons', 'icon-512.png')):
        draw_icons(folder, a.emoji or '🎮', colors)
        print('  icons drawn from', a.emoji or '🎮')
    m = write_manifest(folder, a.name, a.short, colors, a.theme)
    shutil.copy(os.path.join(TPL, 'pwa.js'), os.path.join(ROOT, folder, 'pwa.js'))
    patch_html(folder, m)
    if folder != MENU and a.name:
        add_tile(folder, a.name, a.emoji or '🎮')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('folder', nargs='?', help="game folder name, or '.' for the menu")
    ap.add_argument('--name'); ap.add_argument('--short'); ap.add_argument('--emoji')
    ap.add_argument('--colors', help='"#bg,#theme" gradient colors (top,bottom)')
    ap.add_argument('--theme'); ap.add_argument('--icons', action='store_true', help='redraw icons even if present')
    ap.add_argument('--all', action='store_true', help='refresh every app (keeps names/icons)')
    a = ap.parse_args()
    if a.all:
        for g in [MENU] + games():
            refresh(g, argparse.Namespace(**{**vars(a), 'name': None, 'short': None, 'emoji': None, 'colors': None, 'theme': None, 'icons': False}))
    elif a.folder:
        refresh(a.folder.strip('/') or MENU, a)
    else:
        ap.error('give a folder or --all')
    if not os.path.exists(os.path.join(ROOT, 'manifest.webmanifest')):
        refresh(MENU, argparse.Namespace(name='המשחקים של עומר', short='המשחקים של עומר', emoji='🎮', colors='#ffcb05,#3b4cca', theme=None, icons=False))
    # (re)generate every service worker – the menu one precaches all games so it must follow any change
    for g in games():
        write_sw(g, app_files(g), g)
    menu_files = app_files(MENU) + [f'{g}/{f}' for g in games() for f in app_files(g)]
    write_sw(MENU, menu_files, 'menu')
    print('service workers updated for:', ', '.join(['menu'] + games()))


if __name__ == '__main__':
    main()
