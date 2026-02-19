import sqlite3
from sqlite3 import Error
import uuid

def create_connection(db_file):
    """ 
    Create a database connection to the SQLite database specified by db_file.
    """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(f"Error connecting to database: {e}")
    return conn

def get_table_columns(conn, table_name):
    """ Get list of column names for a table from the database. """
    cursor = conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        # row: (cid, name, type, notnull, dflt_value, pk)
        columns = [row[1] for row in cursor.fetchall()]
        return columns
    except Error as e:
        print(f"Error getting columns: {e}")
        return []

def insert_payments(conn):
    """ 
    Insert payment data for existing orders dynamically.
    """
    table_name = 'user_payment'
    columns = get_table_columns(conn, table_name)

    if not columns:
        print(f"Table '{table_name}' not found. Please ensure migrations are applied.")
        return

    print(f"Found columns in '{table_name}': {', '.join(columns)}")

    try:
        cur = conn.cursor()
        # Fetch necessary fields from user_order
        cur.execute("SELECT id, payment_method, total_amount, transaction_id, payment_status, created_at, user_id FROM user_order")
        orders = cur.fetchall()
    except Error as e:
        print(f"Error fetching orders: {e}")
        return

    if not orders:
        print("No orders found in 'user_order'. Please run insert_orders.py first.")
        return

    payments = []
    for order in orders:
        order_id = order[0]
        method = order[1]
        amount = order[2]
        transaction_id = order[3]
        status = order[4]
        created_at = order[5]
        user_id = order[6]
        
        # Fix for NOT NULL constraint: Generate a placeholder if transaction_id is None
        if transaction_id is None:
            # Generate a dummy transaction ID for pending/failed/COD payments
            transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        # Determine completed_at based on status
        completed_at = created_at if status == 'paid' else None
        
        data_pool = {
            'method': method,
            'amount': amount,
            'transaction_id': transaction_id,
            'status': status,
            'created_at': created_at,
            'completed_at': completed_at,
            'order_id': order_id,
            'user_id': user_id
        }

        row_data = {}
        for col in columns:
            if col == 'id':
                continue
            if col in data_pool:
                row_data[col] = data_pool[col]
        
        payments.append(row_data)

    if not payments:
        return

    insert_keys = list(payments[0].keys())
    columns_sql = ", ".join(insert_keys)
    placeholders = ", ".join(["?"] * len(insert_keys))

    # Use INSERT OR IGNORE to handle unique constraint on order_id
    sql_insert_payment = f''' 
        INSERT OR IGNORE INTO {table_name}({columns_sql})
        VALUES({placeholders}) 
    '''
    
    values = [tuple(p[k] for k in insert_keys) for p in payments]

    try:
        cur = conn.cursor()
        cur.executemany(sql_insert_payment, values)
        conn.commit()
        print(f"Success! {cur.rowcount} payments inserted.")
    except Error as e:
        print(f"Error inserting data: {e}")

def main():
    database = "db.sqlite3"
    conn = create_connection(database)
    if conn is not None:
        insert_payments(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()