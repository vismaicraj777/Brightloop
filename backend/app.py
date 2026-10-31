from db import get_db_connection

try:
    conn = get_db_connection()
    print("Brightloop database connected!")

    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")

    for table in cursor.fetchall():
        print(table[0])

    cursor.close()
    conn.close()

except Exception as e:
    print("Error:", e)
