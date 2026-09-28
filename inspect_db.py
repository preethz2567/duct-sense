import sqlite3, json

conn = sqlite3.connect('backend/sync.db')
conn.row_factory = sqlite3.Row

tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', [t[0] for t in tables])

rows = conn.execute('SELECT * FROM walkthroughs LIMIT 1').fetchall()
if rows:
    row = dict(rows[0])
    print('Columns:', list(row.keys()))
    # parse events_json so it is readable
    row['events_json'] = json.loads(row['events_json'])
    print('Sample row:')
    print(json.dumps(row, indent=2))
else:
    print('walkthroughs table is empty')

conn.close()
