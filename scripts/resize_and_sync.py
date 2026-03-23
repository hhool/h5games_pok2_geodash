#!/usr/bin/env python3
import os, sys, json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
M394 = ROOT / 'assets' / 'games' / 'img' / 'm394x236'
M182 = ROOT / 'assets' / 'games' / 'img' / 'm182x112'
DATA = ROOT / 'data' / 'games.json'
M182.mkdir(parents=True, exist_ok=True)

# read games.json tolerant to trailing commas
text = DATA.read_text(encoding='utf-8')
cleaned = re.sub(r',\s*(?=[\]}])', '', text)
try:
    games = json.loads(cleaned)
except Exception as e:
    print('Failed to parse games.json:', e)
    sys.exit(1)

files = [p for p in M394.iterdir() if p.is_file() and p.suffix.lower() in ('.jpg', '.jpeg', '.png')]
if not files:
    print('No files found in', M394)

resized = []
# Try Pillow first
use_pillow = True
try:
    from PIL import Image
except Exception:
    use_pillow = False

for src in files:
    name = src.name
    small_name = name.replace('m394x236', 'm182x112')
    dst = M182 / small_name
    if dst.exists() and dst.stat().st_size > 0:
        print(f'skipping existing {small_name}')
        resized.append((name, small_name))
        continue
    try:
        if use_pillow:
            with Image.open(src) as im:
                im = im.convert('RGB')
                im = im.resize((182, 112), Image.LANCZOS)
                im.save(dst, quality=90)
        else:
            # fallback to macOS sips
            subprocess.run(['sips', '-z', '112', '182', str(src), '--out', str(dst)], check=True)
        print(f'saved {small_name}')
        resized.append((name, small_name))
    except Exception as e:
        print(f'failed to resize {name}: {e}')

# Build a map from slug -> (small_name, large_name)
map_by_slug = {}
for large, small in resized:
    slug = re.sub(r'-m\d+x\d+\.(jpg|jpeg|png)$', '', large, flags=re.IGNORECASE)
    map_by_slug[slug] = (small, large)

# Update games.json entries
changed = 0
for g in games:
    img = g.get('img')
    if isinstance(img, str):
        # check slug match
        for slug, (small, large) in map_by_slug.items():
            if slug in img:
                g['img'] = [f'img/m182x112/{small}', f'img/m394x236/{large}']
                changed += 1
                break
    elif isinstance(img, list):
        # if second item references a m394 file by slug, skip. If second item refers to m364x224 or m394x236 noneed to change.
        continue

if changed:
    # write back JSON (pretty)
    DATA.write_text(json.dumps(games, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Updated games.json: {changed} entries changed')
else:
    print('No changes to games.json')

print('Done')
