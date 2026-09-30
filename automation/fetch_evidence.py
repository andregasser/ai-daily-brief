"""Parallel, bounded public-page excerpts; fetched text is evidence, never code."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import ipaddress
import re
import socket
import time
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_PAGES = 24
EXCERPT_CHARS = 5000


def public_url(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
        raise ValueError("Only public HTTP(S) sources are accepted")
    if parts.port not in {None, 80, 443}:
        raise ValueError("Nonstandard source port")
    addresses = socket.getaddrinfo(parts.hostname, parts.port or (443 if parts.scheme == "https" else 80), type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
        raise ValueError("Non-public source address")
    return url


class PublicRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class ArticleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []
        self.main_parts = []
        self.main = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "nav", "footer", "noscript"}:
            self.skip += 1
        if tag in {"main", "article"}:
            self.main += 1

    def handle_endtag(self, tag):
        if tag in {"script", "style", "nav", "footer", "noscript"}:
            self.skip = max(0, self.skip - 1)
        if tag in {"main", "article"}:
            self.main = max(0, self.main - 1)

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(data.strip())
            if self.main:
                self.main_parts.append(data.strip())

    def text(self):
        return re.sub(r"\s+", " ", " ".join(self.main_parts or self.parts)).strip()


def fetch_page(item: dict) -> dict:
    started = time.monotonic()
    result = {"url": item["url"], "source": item.get("source", item.get("name", "")), "status": "error"}
    try:
        request = Request(public_url(item["url"]), headers={"User-Agent": "AI-Daily-Brief/1.0", "Accept": "text/html,text/plain"})
        with build_opener(PublicRedirect()).open(request, timeout=10) as response:
            if response.headers.get_content_type() not in {"text/html", "text/plain", "application/xhtml+xml"}:
                raise ValueError("Non-text source; use targeted web verification")
            content = response.read(750_001)
            if len(content) > 750_000:
                raise ValueError("Source exceeds byte limit")
            parser = ArticleText()
            parser.feed(content.decode(response.headers.get_content_charset() or "utf-8", errors="replace"))
            text = parser.text()
            if len(text) < 150:
                raise ValueError("No useful source text")
            result.update(status="ok", final_url=response.url, text=text[:EXCERPT_CHARS], truncated=len(text) > EXCERPT_CHARS)
    except Exception as exc:
        result["error"] = type(exc).__name__  # No arbitrary response bodies in diagnostics.
    result["elapsed_seconds"] = round(time.monotonic() - started, 3)
    return result


def prefetch(candidates: list[dict], manual_checks: list[dict], checkpoint=None) -> list[dict]:
    # Source diversity, not source prestige. Fetch mandatory non-feed landing pages
    # and one candidate per source before spending spare slots on second articles.
    selected, urls = [], set()
    manual = [x for x in manual_checks if x.get("mandatory")]
    # Candidates were already interleaved by source by the collector.
    for item in manual + candidates:
        if item["url"] not in urls:
            selected.append(item)
            urls.add(item["url"])
            if len(selected) == MAX_PAGES:
                break
    results = {}
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {pool.submit(fetch_page, item): index for index, item in enumerate(selected)}
        for future in as_completed(futures):
            results[futures[future]] = future.result()
            if checkpoint:
                checkpoint([results[i] for i in sorted(results)])
    return [results[i] for i in sorted(results)]
