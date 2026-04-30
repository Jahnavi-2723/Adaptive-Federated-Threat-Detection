import sqlite3
import os
from typing import List, Dict, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), 'domain_history.db')

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT,
            domain TEXT,
            score REAL,
            label TEXT,
            llm_explanation TEXT,
            explanation_summary TEXT
        )
    ''')
    conn.commit()
    return conn

_conn = None
def ensure_db():
    global _conn
    if _conn is None:
        _conn = init_db()
    return _conn

def insert_record(ts: str, domain: str, score: float, label: str, llm_explanation: Optional[str], explanation_summary: Optional[str]):
    conn = ensure_db()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO history (ts, domain, score, label, llm_explanation, explanation_summary) VALUES (?, ?, ?, ?, ?, ?)',
        (ts, domain, score, label, llm_explanation, explanation_summary)
    )
    conn.commit()

def query_history(limit: int = 200, label: Optional[str] = None) -> List[Dict]:
    conn = ensure_db()
    cur = conn.cursor()
    if label and label.lower() in ('safe', 'suspicious', 'malicious'):
        cur.execute('SELECT ts, domain, score, label, llm_explanation, explanation_summary FROM history WHERE LOWER(label)=? ORDER BY id DESC LIMIT ?', (label.lower(), limit))
    else:
        cur.execute('SELECT ts, domain, score, label, llm_explanation, explanation_summary FROM history ORDER BY id DESC LIMIT ?', (limit,))
    rows = cur.fetchall()
    results = []
    for r in rows:
        results.append({
            'time': r['ts'],
            'domain': r['domain'],
            'score': r['score'],
            'label': r['label'],
            'llm_explanation': r['llm_explanation'],
            'explanation_summary': r['explanation_summary']
        })
    return results
