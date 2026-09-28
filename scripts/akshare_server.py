#!/usr/bin/env python3
"""
机构持仓数据采集微服务（公募基金重仓 / 社保基金重仓 / QFII / 券商 / 保险 / 信托）
- 直接请求东财 dataapi（https），无需 akshare
- REST JSON 接口，带 CORS；内存缓存 12 小时（季报低频变动）
- 用法: python3 scripts/akshare_server.py [port=8765]
"""
import json
import sys
import time
import urllib.parse
import urllib.request
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime

CACHE_TTL_SEC = 12 * 3600
DEFAULT_DATE = "2026-06-30"  # 最新已披露季度末

API_URL = "https://data.eastmoney.com/dataapi/zlsj/list"
TYPE_MAP = {"fund": "1", "social": "3", "qfii": "2", "broker": "4", "insurance": "5", "trust": "6"}

_cache: dict = {}
_lock = threading.Lock()


def fetch_rows(kind: str, date: str, page_size: int = 50):
    params = {
        "date": date,
        "type": TYPE_MAP[kind],
        "zjc": "0",
        "sortField": "HOLD_VALUE",
        "sortDirec": "1",
        "pageNum": "1",
        "pageSize": str(page_size),
        "p": "1",
        "pageNo": "1",
    }
    url = API_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": "https://data.eastmoney.com/zlsj/sb.html",
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    rows = data.get("data") or []
    # 按持股市值降序取前 10
    rows.sort(key=lambda r: float(r.get("HOLD_VALUE") or 0), reverse=True)
    return rows[:10]


def to_holdings(rows, kind_name: str):
    out = []
    for r in rows:
        code = str(r.get("SECURITY_CODE") or "").zfill(6)
        name = str(r.get("SECURITY_NAME_ABBR") or "")
        if not code or not name:
            continue
        hold_val = float(r.get("HOLD_VALUE") or 0)
        ratio = float(r.get("FREESHARES_RATIO") or 0)
        holdcha = str(r.get("HOLDCHA") or "")
        change = 0.0
        try:
            change = float(r.get("HOLDCHA_RATIO") or 0)
        except (TypeError, ValueError):
            pass
        if holdcha in ("增仓", "新进"):
            status = "increase"
        elif holdcha == "减仓":
            status = "decrease"
        else:
            status = "unchanged"
        out.append({
            "symbol": code,
            "name": name,
            "orgTypeName": str(r.get("ORG_TYPE_NAME") or kind_name),
            "marketValueYi": round(hold_val / 1e8, 1),  # 元 -> 亿元
            "ratio": round(ratio, 2),  # 占流通股比 %
            "changeStatus": status,
            "changePercent": round(change, 2),
        })
    return out


def get_cached(kind: str, date: str):
    key = f"{kind}:{date}"
    with _lock:
        item = _cache.get(key)
        if item and time.time() - item["at"] < CACHE_TTL_SEC:
            return item["data"], True
    return None, False


def build_payload(kind: str, date: str):
    kind_name = {"fund": "公募基金", "social": "社保基金", "qfii": "QFII"}.get(kind, kind)
    data, cached = get_cached(kind, date)
    if data is not None:
        return {"success": True, "kind": kind, "orgTypeName": kind_name, "reportDate": date, "cached": True, "holdings": data}
    try:
        rows = fetch_rows(kind, date)
        holdings = to_holdings(rows, kind_name)
        if not holdings:
            raise ValueError("未获取到有效持仓数据")
    except Exception as exc:  # noqa
        return {"success": False, "kind": kind, "reportDate": date, "error": str(exc)[:300]}
    with _lock:
        _cache[f"{kind}:{date}"] = {"at": time.time(), "data": holdings}
    return {"success": True, "kind": kind, "orgTypeName": kind_name, "reportDate": date, "cached": False, "holdings": holdings}


class Handler(BaseHTTPRequestHandler):
    def _send(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        qs = {}
        if "?" in self.path:
            for kv in self.path.split("?")[1].split("&"):
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    qs[k] = v
        date = qs.get("date", DEFAULT_DATE)
        try:
            if path in ("/health", "/api/ak/health"):
                return self._send({"success": True, "status": "ok", "time": datetime.now().isoformat()})
            if path in ("/api/ak/fund-hold", "/api/ak/fund_hold"):
                return self._send(build_payload("fund", date))
            if path in ("/api/ak/social-security-hold", "/api/ak/social_security_hold"):
                return self._send(build_payload("social", date))
            if path in ("/api/ak/qfii-hold", "/api/ak/qfii_hold"):
                return self._send(build_payload("qfii", date))
            return self._send({"success": False, "error": "not found"}, 404)
        except Exception as exc:  # noqa
            return self._send({"success": False, "error": str(exc)[:300]}, 500)

    def log_message(self, fmt, *args):  # noqa
        sys.stderr.write("[holdings] %s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"[holdings] server listening on http://127.0.0.1:{port}")
    server.serve_forever()