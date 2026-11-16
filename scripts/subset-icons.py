"""Builds a small icon font with only the icons Loftrobin uses.

The full Material Community Icons font is about 1.3 MB (600 KB compressed), more than all of the app's
code together, and every visitor downloads it before icons appear. This keeps only the icons named in src/.

Run it again after using a new icon:   pip install fonttools && python3 scripts/subset-icons.py
"""
import json, pathlib, re
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
VENDOR = ROOT / 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons'
glyphs = json.loads((VENDOR / 'glyphmaps/MaterialCommunityIcons.json').read_text())

# Every quoted word in the source that is also an icon name.
words = set()
for f in (ROOT / 'src').rglob('*.ts*'):
    words |= set(re.findall(r"['\"`]([a-z0-9]+(?:-[a-z0-9]+)*)['\"`]", f.read_text()))
used = {n: glyphs[n] for n in sorted(words) if n in glyphs}

(ROOT / 'src/lib/icon-glyphs.json').write_text(json.dumps(used, indent=0) + '\n')
opts = subset.Options()
opts.layout_features = []
opts.name_IDs = ['*']
font = subset.load_font(str(VENDOR / 'Fonts/MaterialCommunityIcons.ttf'), opts)
s = subset.Subsetter(opts)
s.populate(unicodes=used.values())
s.subset(font)
out = ROOT / 'assets/fonts/loftrobin-icons.ttf'
subset.save_font(font, str(out), opts)
print(f'{len(used)} icons, {out.stat().st_size // 1024} KB')
