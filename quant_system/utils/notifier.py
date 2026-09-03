"""
Structured Logging and Notification Module.
Provides formatted console logging, in-memory/JSON log streaming,
and reserved notification hooks for DingTalk / Feishu / WeChat Work.
"""

import os
import json
import logging
import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

# Setup standard logger
logger = logging.getLogger("QuantTrading")
logger.setLevel(logging.INFO)

# Console handler with clean formatting
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    ch.setFormatter(formatter)
    logger.addHandler(ch)

LOGS_DIR = Path(__file__).resolve().parent.parent / "data"
# Legacy single-file path (kept for read-only fallback on systems that still
# have logs in the old pre-archival format).
LEGACY_LOGS_FILE = LOGS_DIR / "system_logs.json"

# Daily archival protects against high-frequency heartbeat (e.g. 21s
# limit-up pool polling) washing out business-critical events (buy/sell/reset).
# Each trading day writes to its own file: system_logs_YYYY-MM-DD.json
# Per-day cap prevents an abnormal flood from blowing up disk usage.
PER_DAY_LOG_CAP: int = 5000


def _logs_file_for_day(date_str: str) -> Path:
    """Return the archived log file path for the given date (YYYY-MM-DD)."""
    return LOGS_DIR / f"system_logs_{date_str}.json"


def _today_str() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d")


def record_system_log(level: str, category: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Persist structured log event into daily-archived JSON file."""
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "timestamp": now_str,
        "level": level.upper(),
        "category": category,
        "message": message,
        "details": details or {}
    }

    # Also log to python logger
    if level.upper() == "ERROR":
        logger.error(f"[{category}] {message}")
    elif level.upper() == "WARNING":
        logger.warning(f"[{category}] {message}")
    else:
        logger.info(f"[{category}] {message}")

    try:
        log_file = _logs_file_for_day(_today_str())
        log_file.parent.mkdir(parents=True, exist_ok=True)
        logs: List[Dict[str, Any]] = []
        if log_file.exists():
            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    logs = json.load(f)
            except Exception:
                logs = []

        logs.append(entry)
        # Per-day cap: keep latest N within a single day to bound disk usage
        # during pathological polling loops. Normal trading days rarely exceed
        # 1000 entries, so 5000 is generous head-room.
        if len(logs) > PER_DAY_LOG_CAP:
            logs = logs[-PER_DAY_LOG_CAP:]

        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to record system log to JSON: {e}")

    return entry


def get_recent_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieve the most recent `limit` log entries across daily archives.
    Walks archived files newest-first (today → yesterday → ...) and stitches
    entries together so callers always get a contiguous tail of `limit` items.
    Falls back to legacy single-file if no archive exists yet.
    """
    # List archive files newest-first (filename pattern sort = date sort)
    archive_files = sorted(
        LOGS_DIR.glob("system_logs_*.json"),
        key=lambda p: p.name,
        reverse=True,
    )

    result: List[Dict[str, Any]] = []
    for f in archive_files:
        if len(result) >= limit:
            break
        try:
            with open(f, "r", encoding="utf-8") as fp:
                day_logs = json.load(fp)
                if not isinstance(day_logs, list):
                    continue
                needed = limit - len(result)
                # Take the tail of this day's logs; older entries come first
                # chronologically within the day, so prepend to maintain order.
                chunk = day_logs[-needed:] if len(day_logs) >= needed else day_logs
                result = chunk + result
        except Exception as e:
            logger.error(f"Failed to read logs from {f}: {e}")
            continue

    if result:
        return result[-limit:]

    # Fallback: legacy single-file format (pre-archival era)
    if LEGACY_LOGS_FILE.exists():
        try:
            with open(LEGACY_LOGS_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
                if isinstance(logs, list):
                    return logs[-limit:]
        except Exception as e:
            logger.error(f"Failed to read legacy logs: {e}")
    return []


def send_notification(title: str, content: str, channel: str = "all") -> bool:
    """
    Reserved notification hook for trade execution alerts and circuit breakers.
    Can be configured for DingTalk, WeCom, Feishu or Webhook.
    """
    record_system_log("INFO", "Notifier", f"📢 {title}: {content}")
    # Reserved interface for HTTP Webhooks (e.g. DingTalk robot / Feishu)
    webhook_url = os.getenv("NOTIFIER_WEBHOOK_URL", "")
    if webhook_url:
        try:
            import requests
            payload = {
                "msgtype": "text",
                "text": {"content": f"【A股打板量化系统】\n{title}\n{content}"}
            }
            requests.post(webhook_url, json=payload, timeout=3)
        except Exception as err:
            logger.warning(f"Webhook push failed: {err}")
    return True
