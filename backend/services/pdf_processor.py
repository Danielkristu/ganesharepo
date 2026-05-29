"""
PDF Processing Service — demonstrates Python-specific backend value.
Processes academic PDFs from Supabase Storage, extracts metadata,
page count, word count, and auto-generates keyword suggestions.
"""
import io
import re
from collections import Counter

import httpx
import fitz  # PyMuPDF


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STOP_WORDS = frozenset(
    {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
        "that", "this", "it", "its", "as", "so", "if", "not", "no", "we",
        "he", "she", "they", "you", "i", "my", "our", "their", "have", "has",
        "had", "do", "does", "did", "will", "would", "can", "could", "should",
        "may", "might", "shall", "must",
    }
)


def _tokenize(text: str) -> list[str]:
    """Lowercase tokenization stripping punctuation."""
    return re.findall(r"[a-z]{3,}", text.lower())


def _top_keywords(text: str, n: int = 10) -> list[str]:
    tokens = [t for t in _tokenize(text) if t not in _STOP_WORDS]
    return [word for word, _ in Counter(tokens).most_common(n)]


# ---------------------------------------------------------------------------
# Core service
# ---------------------------------------------------------------------------


async def process_pdf_from_url(file_url: str) -> dict:
    """
    Download a PDF from Supabase Storage (or any public URL) and return:
    - page_count
    - word_count
    - keywords (top 10 terms)
    - first_500_chars of extracted text (for abstract preview)

    Args:
        file_url: Public URL of the PDF file in Supabase Storage.

    Returns:
        A dict with extracted metadata.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(file_url)
        response.raise_for_status()
        pdf_bytes = response.content

    doc = fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf")

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    doc.close()

    words = full_text.split()
    keywords = _top_keywords(full_text)

    return {
        "page_count": doc.page_count,
        "word_count": len(words),
        "keywords": keywords,
        "preview": full_text[:500].strip(),
    }
