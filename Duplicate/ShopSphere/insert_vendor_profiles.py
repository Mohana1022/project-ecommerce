import sqlite3
from sqlite3 import Error
import random
from datetime import datetime

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

def insert_vendor_profiles(conn):
    """ 
    Insert sample vendor profiles dynamically based on existing table columns.
    """
    table_name = 'vendor_vendorprofile'
    columns = get_table_columns(conn, table_name)
    
    if not columns:
        print(f"Table '{table_name}' not found. Please ensure migrations are applied.")
        return

    print(f"Found columns in '{table_name}': {', '.join(columns)}")

    profiles = []
    # Vendor IDs 150-159 (Consistent with insert_product_data.py)
    vendor_ids = range(150, 160) 
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    
    # Dummy binary data (will be skipped if column doesn't exist)
    dummy_blob = b'dummy_proof_data'

    for user_id in vendor_ids:
        store_name = f"Vendor Store {user_id}"
        address = f"{random.randint(100, 999)} Market Street"
        phone_number = f"555-01{random.randint(10, 99)}"
        id_proof_path = f"vendor_proofs/vendor_{user_id}_proof.jpg"
        pan_card_path = f"vendor_proofs/vendor_{user_id}_pan.jpg"
        
        data_pool = {
            'user_id': user_id,
            'store_name': store_name,
            'shop_name': store_name,
            'shop_description': f"Official store for {store_name}",
            'address': address,
            'phone_number': phone_number,
            'business_type': 'individual',
            'id_type': 'aadhar',
            'id_number': f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            'id_proof': id_proof_path,
            'id_proof_file': id_proof_path,
            'id_proof_data': dummy_blob,
            'gst_number': f"GST{random.randint(10000, 99999)}Z1",
            'pan_number': f"ABCDE{random.randint(1000, 9999)}F",
            'pan_name': f"Vendor {user_id}",
            'pan_card_file': pan_card_path,
            'approval_status': 'approved',
            'bank_holder_name': f"Vendor {user_id}",
            'bank_account_number': f"1234567890{user_id}",
            'bank_ifsc_code': "SBIN0001234",
            'shipping_fee': 50.0,
            'is_approved': 1, # True
            'is_blocked': 0,
            'created_at': current_time,
            'updated_at': current_time
        }
        
        row_data = {}
        for col in columns:
            if col == 'id':
                continue
            if col in data_pool:
                row_data[col] = data_pool[col]
        
        profiles.append(row_data)

    if not profiles:
        return

    # Prepare SQL
    insert_keys = list(profiles[0].keys())
    columns_sql = ", ".join(insert_keys)
    placeholders = ", ".join(["?"] * len(insert_keys))
    
    sql_insert = f''' 
        INSERT INTO {table_name}({columns_sql})
        VALUES({placeholders}) 
    '''
    
    values = [tuple(p[k] for k in insert_keys) for p in profiles]

    try:
        cur = conn.cursor()
        cur.executemany(sql_insert, values)
        conn.commit()
        print(f"Success! {cur.rowcount} vendor profiles inserted.")
    except Error as e:
        print(f"Error inserting data: {e}")

def main():
    database = "db.sqlite3"

    conn = create_connection(database)
    if conn is not None:
        insert_vendor_profiles(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()