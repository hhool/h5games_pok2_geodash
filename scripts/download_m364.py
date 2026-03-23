#!/usr/bin/env python3
import os, json, urllib.request, urllib.error, sys
from urllib.parse import urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA = os.path.join(ROOT, 'data', 'games.json')
OUT_DIR = os.path.join(ROOT, 'assets', 'games', 'img', 'm364x224')
TIMEOUT = 20
os.makedirs(OUT_DIR, exist_ok=True)

try:
    with open(DATA, 'r', encoding='utf-8') as f:
        games = json.load(f)
except Exception as e:
    print('Failed to read data/games.json:', e)
    sys.exit(1)

headers = {'User-Agent':'Mozilla/5.0 (compatible)'}

for g in games:
    img = g.get('img')
    if not img:
        continue
    # support array or string
    candidates = img if isinstance(img, list) else [img]
    for src in candidates:
        if not isinstance(src, str):
            continue
        if not src.startswith('http'):
            continue
        # replace size token
        new_url = src.replace('m184x112','m364x224').replace('m182x112','m364x224')
        parsed = urlparse(new_url)
        name = os.path.basename(parsed.path)
        outpath = os.path.join(OUT_DIR, name)
        if os.path.exists(outpath) and os.path.getsize(outpath)>0:
            print(f'[{g.get("id")}] exists {name}, skipping')
            break
        try:
            req = urllib.request.Request(new_url, headers=headers)
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                data = r.read()
                if not data:
                    print(f'[{g.get("id")}] empty response for {new_url}')
                    # try original src if different
                    if new_url != src:
                        try:
                            req2 = urllib.request.Request(src, headers=headers)
                            with urllib.request.urlopen(req2, timeout=TIMEOUT) as r2:
                                data2 = r2.read()
                                if data2:
                                    with open(outpath, 'wb') as out:
                                        out.write(data2)
                                    print(f'[{g.get("id")}] saved fallback {name} ({len(data2)} bytes)')
                                    break
                        except Exception as e:
                            print(f'[{g.get("id")}] fallback failed: {e}')
                    break
                with open(outpath, 'wb') as out:
                    out.write(data)
                print(f'[{g.get("id")}] saved {name} ({len(data)} bytes)')
                break
        except urllib.error.HTTPError as e:
            print(f'[{g.get("id")}] HTTPError {e.code} for {new_url}')
            # try original
            if new_url != src:
                try:
                    req2 = urllib.request.Request(src, headers=headers)
                    with urllib.request.urlopen(req2, timeout=TIMEOUT) as r2:
                        data2 = r2.read()
                        if data2:
                            with open(outpath, 'wb') as out:
                                out.write(data2)
                            print(f'[{g.get("id")}] saved fallback {name} ({len(data2)} bytes)')
                            break
                except Exception as e:
                    print(f'[{g.get("id")}] fallback failed: {e}')
        except Exception as e:
            print(f'[{g.get("id")}] Error for {new_url}: {e}')

print('Done')
