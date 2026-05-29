#!/usr/bin/env python3
"""
demo_pdf_processing.py — Standalone script satisfying the Python requirement.

Demonstrates:
  1. Downloading a PDF from a URL (or local file).
  2. Extracting text, page count, word count via PyMuPDF.
  3. Keyword extraction using simple frequency analysis.

Usage:
  python scripts/demo_pdf_processing.py <pdf_url_or_path>

Example:
  python scripts/demo_pdf_processing.py https://arxiv.org/pdf/2301.00001
"""

import sys
import io
import re
from collections import Counter
from pathlib import Path

# Install check
try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed. Run: pip install PyMuPDF")
    sys.exit(1)

try:
    import httpx
except ImportError:
    print("httpx not installed. Run: pip install httpx")
    sys.exit(1)


# ── Config ─────────────────────────────────────────────────────────────────

STOP_WORDS = frozenset(
    {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
        "that", "this", "it", "its", "as", "so", "if", "not", "no", "we",
        "he", "she", "they", "you", "i", "my", "our", "their", "have", "has",
        "had", "do", "does", "did", "will", "would", "can", "could", "should",
        "may", "might", "shall", "must", "also", "their", "which", "than",
        "these", "those", "then", "when", "where", "who", "whom", "how",
    }
)


# ── PDF processing ─────────────────────────────────────────────────────────

def load_pdf(source: str) -> fitz.Document:
    """Load a PDF from a URL or local file path."""
    if source.startswith("http://") or source.startswith("https://"):
        print(f"⬇  Downloading PDF from {source}…")
        response = httpx.get(source, follow_redirects=True, timeout=30.0)
        response.raise_for_status()
        return fitz.open(stream=io.BytesIO(response.content), filetype="pdf")
    else:
        path = Path(source)
        if not path.exists():
            print(f"✗  File not found: {source}")
            sys.exit(1)
        return fitz.open(str(path))


def extract_text(doc: fitz.Document) -> str:
    return "\n".join(page.get_text() for page in doc)


def top_keywords(text: str, n: int = 15) -> list[tuple[str, int]]:
    tokens = re.findall(r"[a-z]{4,}", text.lower())
    filtered = [t for t in tokens if t not in STOP_WORDS]
    return Counter(filtered).most_common(n)


def analyze(source: str) -> dict:
    doc = load_pdf(source)
    text = extract_text(doc)
    words = text.split()
    keywords = top_keywords(text)

    return {
        "source": source,
        "page_count": doc.page_count,
        "word_count": len(words),
        "char_count": len(text),
        "keywords": keywords,
        "preview": text[:400].replace("\n", " ").strip(),
    }


# ── CLI ────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    source = sys.argv[1]
    result = analyze(source)

    print("\n" + "─" * 60)
    print(f"  📄  PDF Analysis Report")
    print("─" * 60)
    print(f"  Source     : {result['source']}")
    print(f"  Pages      : {result['page_count']}")
    print(f"  Words      : {result['word_count']:,}")
    print(f"  Characters : {result['char_count']:,}")
    print("\n  Top Keywords:")
    for word, count in result["keywords"]:
        bar = "█" * min(count // 5, 20)
        print(f"    {word:<20} {count:>4}  {bar}")
    print(f"\n  Preview:\n  \"{result['preview']}…\"")
    print("─" * 60 + "\n")


if __name__ == "__main__":
    main()
