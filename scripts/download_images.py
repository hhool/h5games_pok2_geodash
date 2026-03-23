#!/usr/bin/env python3
import os, json, urllib.request, urllib.error, mimetypes, sys
from urllib.parse import urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA = os.path.join(ROOT, 'data', 'games.json')
OUTDIR = os.path.join(ROOT, 'assets', 'games', 'img', 'm182x112')
TIMEOUT = 20

os.makedirs(OUTDIR, exist_ok=True)

try:
    with open(DATA, 'r', encoding='utf-8') as f:
        games = json.load(f)
except Exception as e:
    print('Failed to read data/games.json:', e)
    sys.exit(1)

def guess_ext(url, headers):
    path = urlparse(url).path
    base, ext = os.path.splitext(path)
    if ext and len(ext) <= 5:
        return ext.lower()
    ct = headers.get('Content-Type', '')
    if ct:
        if ';' in ct:
            ct = ct.split(';',1)[0].strip()
        ext = mimetypes.guess_extension(ct)
        if ext:
            return ext
    return '.png'

for g in games:
    url = g.get('img')
    gid = g.get('id') or g.get('title','game').lower().replace(' ','-')
    if not url:
        print(f'[{gid}] no img url, skipping')
        continue
    filename = None
    try:
        req = urllib.request.Request(url, headers={ 'User-Agent': 'Mozilla/5.0' })
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            headers = {k.lower(): v for k,v in resp.getheaders()}
            ext = guess_ext(url, headers)
            filename = f"{gid}{ext}"
            outpath = os.path.join(OUTDIR, filename)
            with open(outpath, 'wb') as out:
                data = resp.read()
                out.write(data)
            print(f'[{gid}] saved to {outpath} ({len(data)} bytes)')
    except urllib.error.HTTPError as e:
        print(f'[{gid}] HTTPError {e.code} for {url}')
    except urllib.error.URLError as e:
        print(f'[{gid}] URLError for {url}: {e.reason}')
    except Exception as e:
        print(f'[{gid}] Error downloading {url}: {e}')

print('Done')
