import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

# Load environment variables
load_dotenv()

# --- FastAPI App Initialization ---
app = FastAPI(title="AI Intelligence Platform API", version="2.0")

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- Pydantic Models ---
class CurationRequest(BaseModel):
    curator_notes: Optional[str] = None
    enterprise_position: Optional[str] = None

# --- API Routes ---

@app.get("/")
async def root():
    """API root endpoint."""
    return {"message": "AI Intelligence Platform API", "version": "2.0"}

@app.get("/api/tools")
async def get_tools():
    """Get all tools and their associated URLs."""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute("""
                SELECT
                    t.id, t.name, t.description, t.github_url, t.stock_symbol, t.category,
                    t.status, t.run_status, t.last_run,
                    COALESCE(jsonb_agg(jsonb_build_object('url', u.url, 'url_type', u.url_type)) FILTER (WHERE u.id IS NOT NULL), '[]'::jsonb) AS urls
                FROM ai_tools t
                LEFT JOIN tool_urls u ON t.id = u.tool_id
                GROUP BY t.id
                ORDER BY t.name
            """)
            tools = cur.fetchall()
        conn.close()
        return {"tools": [dict(tool) for tool in tools]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tools/{tool_id}")
async def get_tool_detail(tool_id: int):
    """Get details for a specific tool including its URLs and most recent snapshot."""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=DictCursor) as cur:
            # Get tool details and URLs
            cur.execute("""
                SELECT
                    t.id, t.name, t.description, t.github_url, t.stock_symbol, t.category,
                    t.status, t.run_status, t.last_run,
                    COALESCE(jsonb_agg(jsonb_build_object('url', u.url, 'url_type', u.url_type)) FILTER (WHERE u.id IS NOT NULL), '[]'::jsonb) AS urls
                FROM ai_tools t
                LEFT JOIN tool_urls u ON t.id = u.tool_id
                WHERE t.id = %s
                GROUP BY t.id
            """, (tool_id,))
            tool = cur.fetchone()
            if not tool:
                raise HTTPException(status_code=404, detail="Tool not found")

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
        return {
            "tool": dict(tool) if tool else None,
            "snapshot": dict(snapshot) if snapshot else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/snapshots/{snapshot_id}/curate")
async def curate_snapshot(snapshot_id: int, curation: CurationRequest):
    """Save curation data for a snapshot."""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=DictCursor) as cur:
            # Get the tool_id from the snapshot
            cur.execute("SELECT tool_id FROM tool_snapshots WHERE id = %s", (snapshot_id,))
            snapshot = cur.fetchone()
            if not snapshot:
                raise HTTPException(status_code=404, detail="Snapshot not found")
            
            # Insert curation data
            cur.execute(
                """INSERT INTO curated_snapshots (snapshot_id, curator_notes, enterprise_position, curated_by) 
                   VALUES (%s, %s, %s, %s)""",
                (snapshot_id, curation.curator_notes, curation.enterprise_position, 'api_user')
            )
        conn.commit()
        conn.close()
        
        return {"message": "Curation saved successfully", "snapshot_id": snapshot_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/snapshots/{snapshot_id}/curation")
async def get_snapshot_curation(snapshot_id: int):
    """Get curation data for a snapshot."""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute(
                "SELECT * FROM curated_snapshots WHERE snapshot_id = %s ORDER BY curated_at DESC LIMIT 1",
                (snapshot_id,)
            )
            curation = cur.fetchone()
        conn.close()
        
        return {"curation": dict(curation) if curation else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)