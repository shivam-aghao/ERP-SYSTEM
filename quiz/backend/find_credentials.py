import glob, sqlite3

for db_path in glob.glob(r'C:\Users\shiva\AppData\Roaming\Code\User\workspaceStorage\*\state.vscdb'):
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT value FROM ItemTable WHERE value LIKE '%service_role%' OR value LIKE '%postgresql%' OR value LIKE '%gftqv%'")
        rows = cur.fetchall()
        for r in rows:
            txt = str(r[0])
            for kw in ['service_role', 'postgresql://', 'gftqv']:
                pos = 0
                while True:
                    idx = txt.find(kw, pos)
                    if idx == -1:
                        break
                    print(f'[{kw}] in {db_path}:')
                    print(txt[max(0, idx-40):min(len(txt), idx+140)])
                    pos = idx + len(kw) + 10
    except Exception as e:
        pass
