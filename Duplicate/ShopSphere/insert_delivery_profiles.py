import sqlite3
from sqlite3 import Error
import random
from datetime import datetime
import json

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

def insert_delivery_profiles(conn):
    """ 
    Insert sample delivery profiles dynamically based on existing table columns.
    """
    # Try to find the correct table name (handling potential case sensitivity or app naming differences)
    possible_names = [
        'deliveryAgent_deliveryprofile', 
        'deliveryagent_deliveryprofile',
        'deliveryAgent_deliveryagentprofile',
        'deliveryagent_deliveryagentprofile'
    ]
    table_name = None
    columns = []
    
    for name in possible_names:
        cols = get_table_columns(conn, name)
        if cols:
            table_name = name
            columns = cols
            break
            
    if not columns:
        print(f"Table not found. Checked: {possible_names}")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"Available tables in DB: {tables}")
        return

    print(f"Found columns in '{table_name}': {', '.join(columns)}")

    profiles = []
    
    # Delivery Agent IDs from insert_sampleUsers_data.py (160-169)
    delivery_ids = range(160, 170) 
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    vehicle_types = ['bike', 'scooter', 'van', 'truck']

    for user_id in delivery_ids:
        # Generate sample data
        address = f"{random.randint(1, 999)} Delivery Lane, City {user_id}"
        vehicle_type = random.choice(vehicle_types)
        vehicle_number = f"MH-{random.randint(10, 99)}-{random.choice(['AB', 'XY', 'ZZ'])}-{random.randint(1000, 9999)}"
        driving_license_number = f"DL-{user_id}-{random.randint(10000, 99999)}"
        
        # Placeholder for image
        dl_image_path = f"delivery_proofs/agent_{user_id}_dl.jpg"
        
        bank_holder_name = f"Delivery Agent {user_id}"
        bank_account_number = f"987654321{user_id}"
        bank_ifsc_code = "BANK0005678"
        
        data_pool = {
            'user_id': user_id,
            'phone_number': f"9876543{random.randint(100, 999)}",
            'date_of_birth': "1995-01-01",
            'address': address,
            'city': f"City {user_id}",
            'state': "State Name",
            'postal_code': "123456",
            'vehicle_type': vehicle_type,
            'vehicle_number': vehicle_number,
            'vehicle_registration': f"reg_docs/veh_{user_id}.pdf",
            'vehicle_insurance': f"ins_docs/ins_{user_id}.pdf",
            'driving_license_number': driving_license_number,
            'license_number': driving_license_number,
            'dl_image': dl_image_path,
            'driving_license_file': dl_image_path, # Potential alternate name
            'license_file': dl_image_path,
            'license_expires': "2030-01-01",
            'id_type': 'aadhar',
            'id_number': f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            'id_proof_file': f"id_proofs/id_{user_id}.jpg",
            'bank_holder_name': bank_holder_name,
            'bank_account_number': bank_account_number,
            'bank_ifsc_code': bank_ifsc_code,
            'bank_name': "Sample Bank",
            'approval_status': 'approved',
            'rejection_reason': None,
            'availability_status': 'available',
            'is_approved': 1,
            'is_active': 1,
            'is_blocked': 0,
            'blocked_reason': None,
            'service_cities': json.dumps([f"City {user_id}"]),
            'preferred_delivery_radius': 10,
            'working_hours_start': "09:00:00",
            'working_hours_end': "18:00:00",
            'total_deliveries': 0,
            'completed_deliveries': 0,
            'cancelled_deliveries': 0,
            'average_rating': 0.0,
            'total_reviews': 0,
            'total_earnings': 0.0,
            'created_at': current_time,
            'updated_at': current_time,
            'approved_at': current_time,
            'last_online': current_time
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
        print(f"Success! {cur.rowcount} delivery profiles inserted.")
    except Error as e:
        print(f"Error inserting data: {e}")

def main():
    database = "db.sqlite3"

    conn = create_connection(database)
    if conn is not None:
        insert_delivery_profiles(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()