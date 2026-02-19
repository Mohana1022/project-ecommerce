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

def insert_reviews(conn):
    """ 
    Insert sample reviews dynamically based on existing table columns.
    """
    table_name = 'user_review'
    columns = get_table_columns(conn, table_name)

    if not columns:
        print(f"Table '{table_name}' not found. Please ensure migrations are applied.")
        return

    print(f"Found columns in '{table_name}': {', '.join(columns)}")

    product_ids = get_product_ids(conn)
    
    if not product_ids:
        print("No products found in 'vendor_product'. Please run insert_product_data.py first.")
        return

    reviews = []
    # Customer IDs: 100-149 (Consistent with insert_orders.py)
    user_ids = range(100, 150) 
    
    sample_comments = [
        ("Excellent product, highly recommended!", 5),
        ("Good value for the price.", 4),
        ("Average quality, but works.", 3),
        ("Not satisfied with the purchase.", 2),
        ("Terrible, arrived damaged.", 1),
        ("Fast shipping and great item.", 5),
        ("Okay, but could be better.", 3),
        ("Loved it!", 5),
        ("Waste of money.", 1),
        ("Exactly as described.", 4)
    ]
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

    # Generate 150 sample reviews
    for _ in range(150):
        user_id = random.choice(user_ids)
        product_id = random.choice(product_ids)
        
        comment_data = random.choice(sample_comments)
        comment = comment_data[0]
        rating = comment_data[1]
        
        pictures = None # Placeholder for image path/data
        
        data_pool = {
            'rating': rating,
            'comment': comment,
            'pictures': pictures,
            'created_at': current_time,
            'updated_at': current_time,
            'product_id': product_id,
            'Product_id': product_id,
            'user_id': user_id,
            'reviewer_name': f"User {user_id}"
        }

        row_data = {}
        for col in columns:
            if col == 'id':
                continue
            if col in data_pool:
                row_data[col] = data_pool[col]
        
        reviews.append(row_data)

    if not reviews:
        return

    insert_keys = list(reviews[0].keys())
    columns_sql = ", ".join(insert_keys)
    placeholders = ", ".join(["?"] * len(insert_keys))

    sql_insert_review = f''' 
        INSERT INTO {table_name}({columns_sql})
        VALUES({placeholders}) 
    '''
    
    values = [tuple(p[k] for k in insert_keys) for p in reviews]

    try:
        cur = conn.cursor()
        cur.executemany(sql_insert_review, values)
        conn.commit()
        print(f"Success! {cur.rowcount} reviews inserted.")
    except Error as e:
        print(f"Error inserting data: {e}")

def main():
    database = "db.sqlite3"

    conn = create_connection(database)
    if conn is not None:
        insert_reviews(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()