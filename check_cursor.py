#!/usr/bin/env python3
from src.database import Database
import psycopg2.extras
import json

def main():
    db = Database()
    cur = db.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Check latest snapshots for Cursor
    cur.execute('''
        SELECT tool_id, snapshot_date, 
               community_metrics->>'github_stars' as stars,
               community_metrics->>'reddit_mentions' as reddit,
               company_info->>'employee_count' as employees
        FROM tool_snapshots 
        WHERE tool_id = 1 
        ORDER BY snapshot_date DESC 
        LIMIT 3
    ''')
    
    rows = cur.fetchall()
    print('Cursor snapshots:')
    for row in rows:
        print(f'  {row["snapshot_date"]}: {row["stars"]} stars, {row["reddit"]} reddit, {row["employees"]} employees')
    
    # Check if we have any community metrics at all
    cur.execute('''
        SELECT community_metrics 
        FROM tool_snapshots 
        WHERE tool_id = 1 
        ORDER BY snapshot_date DESC 
        LIMIT 1
    ''')
    
    row = cur.fetchone()
    if row and row['community_metrics']:
        print('\nCommunity metrics keys:')
        metrics = row['community_metrics']
        for key, value in metrics.items():
            if value is not None:
                print(f'  {key}: {value}')
    else:
        print('\nNo community metrics found')
    
    db.close()

if __name__ == '__main__':
    main() 