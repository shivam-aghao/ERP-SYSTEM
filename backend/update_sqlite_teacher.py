import sqlite3

conn = sqlite3.connect('backend/erp.db')
cur = conn.cursor()
cur.execute("UPDATE teachers SET designation = 'Head Of Department' WHERE emp_code = 'EMP-CSE-1001'")
conn.commit()
print("Updated SQLite teachers rows:", cur.rowcount)
cur.execute("SELECT id, emp_code, full_name, designation FROM teachers WHERE emp_code = 'EMP-CSE-1001'")
print("Updated row:", cur.fetchone())
conn.close()
