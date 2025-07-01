"""
Database utilities for AI tool intelligence platform.

This module contains database connection and utility functions.
"""
import os
import logging
import psycopg2
import datetime
from psycopg2.extras import DictCursor, Json


# Database configuration
DB_NAME = os.getenv("DB_NAME", "ai_database")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")


class Database:
    def __init__(self):
        self.conn = self._get_connection()

    def _get_connection(self):
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

    def get_tools_to_process(self):
        """
        Fetches tools that need to be processed and their associated URLs.
        """
        if not self.conn:
            return []
        with self.conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute("""
                SELECT
                    t.id,
                    t.name,
                    t.description,
                    t.category,
                    t.github_url,
                    t.stock_symbol,
                    t.status,
                    t.run_status,
                    t.last_run,
                    (SELECT url FROM tool_urls WHERE tool_id = t.id AND url_type = 'website') AS website_url,
                    (SELECT url FROM tool_urls WHERE tool_id = t.id AND url_type = 'documentation') AS documentation_url,
                    (SELECT url FROM tool_urls WHERE tool_id = t.id AND url_type = 'blog') AS blog_url,
                    (SELECT url FROM tool_urls WHERE tool_id = t.id AND url_type = 'changelog') AS changelog_url
                FROM
                    ai_tools t
                WHERE
                    t.run_status IS NULL OR t.run_status = 'update' OR t.run_status = 'failed'
                ORDER BY
                    t.id;
            """)
            tools = cur.fetchall()
            return [dict(row) for row in tools]

    def update_tool_run_status(self, tool_id, status, error_message=None):
        """Updates the run status of a tool."""
        if not self.conn:
            return
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE ai_tools SET run_status = %s, last_run = %s, error_message = %s WHERE id = %s",
                (status, datetime.datetime.now(), error_message, tool_id)
            )
        self.conn.commit()

    def create_snapshot(self, tool_id, structured_data_dict, raw_data_dict):
        """Creates a new snapshot for a tool, breaking down data into respective columns."""
        if not self.conn:
            return

        basic_info = structured_data_dict.get('basic_info')
        technical_details = structured_data_dict.get('technical_details')
        company_info = structured_data_dict.get('company_info')
        community_metrics = structured_data_dict.get('community_metrics')

        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO tool_snapshots (
                    tool_id, snapshot_date, basic_info, technical_details, 
                    company_info, community_metrics, raw_data
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    tool_id, 
                    datetime.datetime.now(), 
                    Json(basic_info), 
                    Json(technical_details), 
                    Json(company_info), 
                    Json(community_metrics),
                    Json(raw_data_dict)
                )
            )
        self.conn.commit()

    def close(self):
        """Closes the database connection."""
        if self.conn:
            self.conn.close()
            logging.info("Database connection closed.")