import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ShopSphere.settings')
django.setup()

from vendor.models import Product, ProductImage
from django.core.files import File

MEDIA_PRODUCTS_DIR = r'c:\project-shopsphere\project-ecommerce\Duplicate\ShopSphere\media\products'

def migrate_images():
    if not os.path.exists(MEDIA_PRODUCTS_DIR):
        print(f"Directory {MEDIA_PRODUCTS_DIR} not found.")
        return

    files = os.listdir(MEDIA_PRODUCTS_DIR)
    print(f"Found {len(files)} files in media/products")

    products = list(Product.objects.all())
    
    for filename in files:
        filepath = os.path.join(MEDIA_PRODUCTS_DIR, filename)
        if not os.path.isfile(filepath):
            continue

        target_product = None
        lower_filename = filename.lower()

        # Try to match by product name
        for p in products:
            normalized_name = p.name.lower().replace(' ', '_')
            if normalized_name in lower_filename:
                target_product = p
                break
        
        # Try to match by leading ID number (e.g., 1.jpg, 1_abc.jpg)
        if not target_product:
            parts = filename.split('_')
            if parts[0].isdigit():
                pid = int(parts[0])
                target_product = Product.objects.filter(id=pid).first()
            elif '.' in parts[0] and parts[0].split('.')[0].isdigit():
                pid = int(parts[0].split('.')[0])
                target_product = Product.objects.filter(id=pid).first()

        if target_product:
            print(f"Migrating {filename} to Product: {target_product.name} (ID: {target_product.id})")
            
            # Check if this exact filename is already there with data
            if ProductImage.objects.filter(product=target_product, image_filename=filename).exclude(image_data=None).exists():
                print(f"  Skipping {filename}: already exists in DB with data.")
                continue

            try:
                with open(filepath, 'rb') as f:
                    data = f.read()
                    import mimetypes
                    mimetype, _ = mimetypes.guess_type(filename)
                    
                    ProductImage.objects.create(
                        product=target_product,
                        image_data=data,
                        image_mimetype=mimetype or 'image/jpeg',
                        image_filename=filename
                    )
                print(f"  Successfully migrated {filename}")
            except Exception as e:
                print(f"  Error migrating {filename}: {e}")
        else:
            print(f"Could not find matching product for {filename}")

if __name__ == '__main__':
    migrate_images()
