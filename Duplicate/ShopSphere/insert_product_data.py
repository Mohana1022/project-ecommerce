import sqlite3
from sqlite3 import Error
import random
from datetime import datetime
import re

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

def slugify(text):
    """ Simple slugify function. """
    text = text.lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def insert_sample_products(conn):
    """ 
    Insert sample products dynamically based on existing table columns.
    """
    table_name = 'vendor_product'
    columns = get_table_columns(conn, table_name)
    
    if not columns:
        print(f"Table '{table_name}' not found. Please ensure migrations are applied.")
        return

    print(f"Found columns in '{table_name}': {', '.join(columns)}")

    products = []
    vendor_ids = range(150, 160) 
    
    product_names = [
        "Smartphone", "Laptop", "Headphones", "Smart Watch", "Tablet", 
        "Camera", "Printer", "Monitor", "Keyboard", "Mouse",
        "T-Shirt", "Jeans", "Sneakers", "Jacket", "Backpack"
    ]
    
    statuses = ['active', 'active', 'active', 'out_of_stock'] # Weighted towards active
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

    for vendor_id in vendor_ids:
        # Generate 5 products per vendor
        for i in range(1, 6):
            base_name = random.choice(product_names)
            name = f"{base_name} {vendor_id}-{i}"
            slug = slugify(name)
            description = f"High quality {base_name} sold by Vendor {vendor_id}."
            price = round(random.uniform(10.0, 1000.0), 2)
            quantity = random.randint(0, 100)
            status = random.choice(statuses)
            category_id = random.randint(1, 5) # Assuming categories 1-5 exist
            category_name = random.choice(["Electronics", "Fashion", "Home", "Beauty", "Sports"])
            
            # Prepare all possible data fields
            data_pool = {
                'name': name,
                'slug': slug,
                'description': description,
                'price': price,
                'quantity': quantity,
                'status': status,
                'approval_status': 'approved',
                'is_blocked': 0,
                'blocked_reason': None,
                'created_at': current_time,
                'updated_at': current_time,
                'category_id': category_id,
                'category': category_name,
                'vendor_id': vendor_id
            }
            
            # Build the row based on actual columns
            row_data = {}
            for col in columns:
                if col == 'id':
                    continue
                if col in data_pool:
                    row_data[col] = data_pool[col]
            
            products.append(row_data)

    if not products:
        return

    # Prepare SQL
    insert_keys = list(products[0].keys())
    columns_sql = ", ".join(insert_keys)
    placeholders = ", ".join(["?"] * len(insert_keys))
    
    sql_insert_product = f''' 
        INSERT INTO {table_name}({columns_sql})
        VALUES({placeholders}) 
    '''
    
    values = [tuple(p[k] for k in insert_keys) for p in products]

    try:
        cur = conn.cursor()
        cur.executemany(sql_insert_product, values)
        conn.commit()
        print(f"Success! {cur.rowcount} products inserted.")
    except Error as e:
        print(f"Error inserting data: {e}")

def main():
    database = "db.sqlite3"

    conn = create_connection(database)
    if conn is not None:
        insert_sample_products(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()