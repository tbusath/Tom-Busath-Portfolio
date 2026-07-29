#!/usr/bin/env python3
"""Encrypt the plaintext case-study pages in _src/ into password-gated pages at the repo root.

Usage:
    python3 encrypt.py                 # prompts for the password (hidden)
    PORTFOLIO_PW=yourpass python3 encrypt.py   # non-interactive

- Plaintext sources live in _src/ (gitignored -- never committed to the public repo).
- Output overwrites the same-named .html at the repo root; those encrypted files ARE committed/served.
- index.html stays public (do not put it in _src/).
Re-run this whenever you edit a source page or change the password.
"""
import os, re, base64, glob, getpass, hashlib, mimetypes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ITER = 200000
HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

# Images referenced by a gated page are inlined as data: URIs BEFORE encryption.
# This is essential: GitHub Pages serves every file in the repo at a public URL, so
# an <img src="images/foo.png"> inside an encrypted page would still be fetchable by
# anyone who guesses the path -- no password required. Inlining means the bytes only
# ever exist inside the ciphertext.
IMG_ATTR = re.compile(r'(<img\b[^>]*?\ssrc=")([^"]+)(")', re.IGNORECASE)
_missing = []
_inlined = []


def inline_images(html, page):
    def repl(m):
        pre, path, post = m.group(1), m.group(2), m.group(3)
        if path.startswith(("data:", "http://", "https://", "//")):
            return m.group(0)
        fs = os.path.normpath(path.split("?", 1)[0].split("#", 1)[0])
        if not os.path.isfile(fs):
            _missing.append((page, path))
            return m.group(0)
        mime = mimetypes.guess_type(fs)[0] or "application/octet-stream"
        with open(fs, "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode("ascii")
        _inlined.append((page, path, len(b64)))
        return pre + "data:" + mime + ";base64," + b64 + post

    return IMG_ATTR.sub(repl, html)


pw = os.environ.get("PORTFOLIO_PW") or getpass.getpass("Portfolio password: ")
if not pw:
    raise SystemExit("No password provided.")

template = open(os.path.join("_gate", "template.html"), encoding="utf-8").read()
srcs = sorted(glob.glob(os.path.join("_src", "*.html")))
if not srcs:
    raise SystemExit("No source pages found in _src/")

for src in srcs:
    name = os.path.basename(src)
    html = open(src, encoding="utf-8").read()
    html = inline_images(html, name)
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, ITER, 32)
    ct = AESGCM(key).encrypt(iv, html.encode("utf-8"), None)
    payload = base64.b64encode(salt + iv + ct).decode("ascii")
    out = template.replace("__PAYLOAD_B64__", payload).replace("__ITER__", str(ITER))
    with open(name, "w", encoding="utf-8") as f:
        f.write(out)
    print("encrypted -> %s  (%.1f KB)" % (name, len(out) / 1024.0))

print("\nDone. %d page(s) encrypted at repo root." % len(srcs))
if _inlined:
    total = sum(n for _, _, n in _inlined) / 1024.0
    print("Inlined %d image(s), %.1f KB of base64 total." % (len(_inlined), total))
if _missing:
    print("\n!! %d image reference(s) could not be found and were left as plain paths." % len(_missing))
    for page, path in _missing:
        print("   %s -> %s" % (page, path))
    print("   Fix these before publishing: an unresolved path either 404s for viewers")
    print("   or, if the file exists in the repo, is served publicly with NO password.")
