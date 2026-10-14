#!/usr/local/bin/python3.12
"""Lightweight link sharing service for Suizhou."""

import datetime
import hashlib
import json
import os
import re
import sys
import time
from http import HTTPStatus
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

DATA_DIR = os.environ.get("SUIZHOU_DATA_DIR", "/var/www/suizhou/data")
DATA_FILE = os.path.join(DATA_DIR, "links.json")
HOST = os.environ.get("SUIZHOU_HOST", "127.0.0.1")
PORT = int(os.environ.get("SUIZHOU_PORT", "8321"))


def ensure_data_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE + ".tmp", "w", encoding="utf-8") as f:
            json.dump([], f)
        os.replace(DATA_FILE + ".tmp", DATA_FILE)


def read_links():
    ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def write_links(links):
    ensure_data_file()
    tmp_path = DATA_FILE + f".tmp.{os.getpid()}_{int(time.time()*1000)}"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(links, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, DATA_FILE)


def normalize_url(raw_url):
    url = (raw_url or "").strip()
    if not url:
        return ""
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        return ""
    return url


class LinkRequestHandler(BaseHTTPRequestHandler):
    server_version = "SuizhouLinkServer/1.0"

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/api/links", "/api/links/"):
            links = read_links()
            self.send_json(HTTPStatus.OK, {"ok": True, "links": links})
        elif parsed.path == "/api/health":
            self.send_json(HTTPStatus.OK, {"ok": True, "time": datetime.datetime.now().isoformat()})
        else:
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not Found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path not in ("/api/links", "/api/links/"):
            return self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not Found"})

        content_length = int(self.headers.get("Content-Length", 0))
        if content_length <= 0 or content_length > 64 * 1024:
            return self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid request payload size"})

        try:
            raw_body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(raw_body)
        except Exception:
            return self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Malformed JSON payload"})

        raw_url = data.get("url")
        url = normalize_url(raw_url)
        if not url:
            return self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "请输入有效的网址"})

        parsed_url = urlparse(url)
        domain = parsed_url.netloc

        note = str(data.get("note", "")).strip()[:300]
        sender = str(data.get("sender", "")).strip()[:50]

        now = datetime.datetime.now()
        timestamp = int(now.timestamp())
        item_id = hashlib.sha1(f"{url}_{timestamp}_{time.time_ns()}".encode("utf-8")).hexdigest()[:12]

        item = {
            "id": item_id,
            "url": url,
            "domain": domain,
            "note": note,
            "sender": sender,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": timestamp,
        }

        links = read_links()
        links.insert(0, item)
        # 保留最近 1000 条分享
        if len(links) > 1000:
            links = links[:1000]
        write_links(links)

        self.send_json(HTTPStatus.CREATED, {"ok": True, "item": item})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path not in ("/api/links", "/api/links/"):
            return self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not Found"})

        query = parse_qs(parsed.query)
        item_id = query.get("id", [""])[0]
        if not item_id:
            return self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Missing link id"})

        links = read_links()
        new_links = [l for l in links if l.get("id") != item_id]
        if len(new_links) == len(links):
            return self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Link not found"})

        write_links(new_links)
        self.send_json(HTTPStatus.OK, {"ok": True, "message": "Link deleted successfully"})

    def log_message(self, format, *args):
        # 保持安静，不污染标准输出，只在错误时记录
        if args and str(args[1]).startswith(("4", "5")):
            sys.stderr.write(f"[{datetime.datetime.now().isoformat()}] {format % args}\n")


def main():
    ensure_data_file()
    server = HTTPServer((HOST, PORT), LinkRequestHandler)
    print(f"Suizhou link service running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
