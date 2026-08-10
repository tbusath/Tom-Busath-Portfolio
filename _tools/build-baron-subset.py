#!/usr/bin/env python3
"""Build the subsetted Baron Neue webfont used for display type.

Source: Baron Neue Bold.otf (Frank Hemmekam / Fontfabric, personal license).
The personal EULA permits @font-face on a personal web page provided the site
credits Fontfabric with a link — see the colophon in index.html.

Two things this does that a plain conversion would not:

1. Subsets to the characters the site actually sets in the display face, so we
   ship ~15 KB instead of the whole family.
2. Keeps the `salt` (Stylistic Alternates) feature, but keeps ONLY `A.alt2` as
   the alternate for A. A.alt2 is the crossbar-less triangular A used in Tom's
   name on his 2017 resume. Trimming the alternate list to one entry means the
   CSS is a stable `font-feature-settings: "salt" 1` — with the full list, A is
   the 6th alternate and the index would shift on any re-subset.

Usage:  python3 _tools/build-baron-subset.py
Needs:  pip install --user fonttools brotli
"""

import os
import sys
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

SRC = os.path.expanduser("~/Downloads/Baron Neue/Baron Neue Bold.otf")
DST = os.path.join(os.path.dirname(__file__), "..", "fonts", "BaronNeue-Bold.woff2")
ALT = "A.alt2"

# Basic Latin plus the typographic characters the site uses in headings.
UNICODES = list(range(0x20, 0x7F)) + [
    0x2013, 0x2014,          # en dash, em dash
    0x2018, 0x2019,          # curly single quotes
    0x201C, 0x201D,          # curly double quotes
    0x2026,                  # ellipsis
    0x00A9, 0x00B0, 0x00E9,  # (c), degree, e-acute
]


def main():
    if not os.path.exists(SRC):
        sys.exit("Source font not found: %s" % SRC)

    font = TTFont(SRC)
    if ALT not in font.getGlyphOrder():
        sys.exit("Expected glyph %s missing from %s" % (ALT, SRC))

    # Trim `salt` to a single substitution, A -> A.alt2, BEFORE subsetting.
    # Two reasons this has to happen first: the subsetter's GSUB closure would
    # otherwise drag in all six A alternates, and salt also carries alternates
    # for C D E F H I M N O S T W X. Left in place, `salt 1` would swap the T in
    # "Tom" for T.alt as well. We want the feature to touch exactly one letter.
    # Both cases are mapped on purpose. Baron is caps-only and the A and a
    # glyphs are identical outlines, so markup can stay honest ("Tom Busath",
    # not the resume's "Tom BusAth") and still get the alternate on the a.
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if getattr(st, "alternates", None) is not None:
                st.alternates = {"A": [ALT], "a": [ALT]} if "A" in st.alternates else {}

    opts = Options()
    opts.layout_features = ["salt"]   # drop every other GSUB/GPOS feature
    opts.desubroutinize = True
    opts.name_IDs = ["*"]             # keep name table (foundry attribution)
    opts.notdef_outline = True

    sub = Subsetter(options=opts)
    sub.populate(unicodes=UNICODES, glyphs=[ALT])
    sub.subset(font)

    # A and a should each now have exactly one alternate, making it index 1.
    # Assert rather than assume — this is what the CSS depends on.
    alts = None
    for record in font["GSUB"].table.FeatureList.FeatureRecord:
        if record.FeatureTag != "salt":
            continue
        for idx in record.Feature.LookupListIndex:
            for st in font["GSUB"].table.LookupList.Lookup[idx].SubTable:
                if getattr(st, "alternates", None) and "A" in st.alternates:
                    alts = st.alternates
    if alts != {"A": [ALT], "a": [ALT]}:
        sys.exit("salt alternates are %r, expected A and a -> ['%s']" % (alts, ALT))

    font.flavor = "woff2"
    font.save(DST)
    print("Wrote %s (%.1f KB), salt 1 -> %s" % (
        os.path.normpath(DST), os.path.getsize(DST) / 1024.0, ALT))


if __name__ == "__main__":
    main()
