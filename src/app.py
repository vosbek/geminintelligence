import os
from flask import Flask, render_template, abort, request, redirect, url_for
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Flask App Initialization ---
app = Flask(__name__)

# --- Database Configuration ---
DB_NAME = os.getenv("DB_NAME", "ai_platform")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn

# --- Flask Routes ---

@app.route('/')
def index():
    """Main page, lists all tools in the database."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute("SELECT * FROM ai_tools ORDER BY name")
        tools = cur.fetchall()
    conn.close()
    return render_template('index.html', tools=tools)

@app.route('/tool/<int:tool_id>')
def tool_detail(tool_id):
    """Displays the most recent snapshot for a specific tool."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=DictCursor) as cur:
        # Get tool details
        cur.execute("SELECT * FROM ai_tools WHERE id = %s", (tool_id,))
        tool = cur.fetchone()
        if not tool:
            abort(404)

        # Get the most recent snapshot for this tool
        cur.execute(
            """SELECT * FROM tool_snapshots 
               WHERE tool_id = %s 
               ORDER BY snapshot_date DESC 
               LIMIT 1""", 
            (tool_id,)
        )
        snapshot = cur.fetchone()

    conn.close()
    return render_template('tool_detail.html', tool=tool, snapshot=snapshot)

@app.route('/curate/<int:snapshot_id>', methods=['POST'])
def curate_snapshot(snapshot_id):
    """Saves curation data for a snapshot."""
    notes = request.form.get('curator_notes')
    position = request.form.get('enterprise_position')
    
    conn = get_db_connection()
    with conn.cursor(cursor_factory=DictCursor) as cur:
        # Get the tool_id from the snapshot
        cur.execute("SELECT tool_id FROM tool_snapshots WHERE id = %s", (snapshot_id,))
        snapshot = cur.fetchone()
        if not snapshot:
            abort(404)
        
        # Insert or update curation data
        # A more robust app would use INSERT ... ON CONFLICT (snapshot_id) DO UPDATE
        cur.execute(
            """INSERT INTO curated_snapshots (snapshot_id, curator_notes, enterprise_position, curated_by) 
               VALUES (%s, %s, %s, %s)""",
            (snapshot_id, notes, position, 'local_user') # Placeholder for user management
        )
    conn.commit()
    conn.close()
    
    return redirect(url_for('tool_detail', tool_id=snapshot['tool_id']))

if __name__ == '__main__':
    app.run(debug=True, port=5001)
