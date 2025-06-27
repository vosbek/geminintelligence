"""
Database utilities for AI tool intelligence platform.

This module contains database connection and utility functions.
"""
import os
import logging
import psycopg2
import datetime
from psycopg2.extras import DictCursor


# Database configuration
DB_NAME = os.getenv("DB_NAME", "ai_database")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")


def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        logging.info("Successfully connected to the database.")
        return conn
    except psycopg2.OperationalError as e:
        logging.error(f"Could not connect to the database: {e}")
        return None


def get_tools_to_process(conn):
    """
    Fetches tools that need to be processed and their associated URLs.
    Each tool record will include a 'urls' key with a list of its URLs.
    """
    with conn.cursor(cursor_factory=DictCursor) as cur:
        # We use a LEFT JOIN to ensure tools with no URLs are still fetched
        cur.execute("""
            SELECT
                t.id,
                t.name,
                t.description,
                t.github_url,
                t.stock_symbol,
                t.category,
                t.status,
                t.run_status,
                t.last_run,
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object('url', u.url, 'url_type', u.url_type)
                    ) FILTER (WHERE u.id IS NOT NULL),
                    '[]'::jsonb
                ) AS urls
            FROM
                ai_tools t
            LEFT JOIN
                tool_urls u ON t.id = u.tool_id
            WHERE
                t.run_status IS NULL OR t.run_status = 'update'
            GROUP BY
                t.id
            ORDER BY
                t.id;
        """)
        tools = cur.fetchall()
        logging.info(f"Found {len(tools)} tools to process.")
        return tools


def update_tool_run_status(conn, tool_id, status, last_run_time=None):
    """Updates the run status of a tool."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE ai_tools SET run_status = %s, last_run = %s WHERE id = %s",
            (status, last_run_time, tool_id)
        )
    conn.commit()