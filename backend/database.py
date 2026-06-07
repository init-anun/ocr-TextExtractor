import sqlite3
import os

DB_FILE = "ocr_history.db"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ocr_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            extracted_text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_ocr_result(filename: str, extracted_text: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO ocr_history (filename, extracted_text) VALUES (?, ?)",
        (filename, extracted_text)
    )
    conn.commit()
    row_id = cursor.lastrowid
    conn.close()
    return row_id

def get_all_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, extracted_text, timestamp FROM ocr_history ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_history_item(item_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ocr_history WHERE id = ?", (item_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def clear_all_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ocr_history")
    conn.commit()
    conn.close()
