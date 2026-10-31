import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="ronaldo123/7",
        database="brightloop_db"
    )
