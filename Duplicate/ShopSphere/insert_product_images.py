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

def get_product_ids(conn):
    """
    Fetch all existing product IDs from the vendor_product table.
    """
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM vendor_product")
        rows = cur.fetchall()
        return [row[0] for row in rows]
    except Error as e:
        print(f"Error fetching products: {e}")
        return []

def insert_product_images(conn):
    """ 
    Insert 4 sample images for each product found in the database dynamically.
    """
    table_name = 'vendor_productimage'
    columns = get_table_columns(conn, table_name)

    if not columns:
        print(f"Table '{table_name}' not found. Please ensure migrations are applied.")
        return

    print(f"Found columns in '{table_name}': {', '.join(columns)}")

    product_ids = get_product_ids(conn)
    
    if not product_ids:
        print("No products found in 'vendor_product'. Please run insert_product_data.py first.")
        return

    images = []
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    
    # Minimal valid JPEG binary (1x1 pixel)
    hex_data = "FFD8FFE000104A46494600010101004800480000FFDB004300FFFFFF00000000000000000000000000000000000000000000000000000000FFC0000B080001000101011100FFC4001F0000010501010101010100000000000000000102030405060708090A0BFFDA0008010100003F007F00"
    dummy_image_data = bytes.fromhex(hex_data)

    for product_id in product_ids:
        # Generate 4 images per product
        for i in range(1, 5):
            image_name = f"product_{product_id}_img_{i}.jpg"
            image_mimetype = "image/jpeg"
            image_path = f"products/{image_name}"
            
            data_pool = {
                'image': image_path,
                'image_data': dummy_image_data,
                'image_name': image_name,
                'image_mimetype': image_mimetype,
                'uploaded_at': current_time,
                'created_at': current_time,
                'updated_at': current_time,
                'product_id': product_id
            }

            row_data = {}
            for col in columns:
                if col == 'id':
                    continue
                if col in data_pool:
                    row_data[col] = data_pool[col]
            
            images.append(row_data)

    if not images:
        return

    insert_keys = list(images[0].keys())
    columns_sql = ", ".join(insert_keys)
    placeholders = ", ".join(["?"] * len(insert_keys))

    sql_insert_image = f''' 
        INSERT INTO {table_name}({columns_sql})
        VALUES({placeholders}) 
    '''
    
    values = [tuple(p[k] for k in insert_keys) for p in images]

    try:
        cur = conn.cursor()
        cur.executemany(sql_insert_image, values)
        conn.commit()
        print(f"Success! {cur.rowcount} product images inserted.")
    except Error as e:
        print(f"Error inserting data: {e}")

def main():
    database = "db.sqlite3"

    conn = create_connection(database)
    if conn is not None:
        insert_product_images(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()