import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ShopSphere.settings')
django.setup()

from user.models import AuthUser

email = 'allamsudhakarrao041@gmail.com'
user = AuthUser.objects.filter(email=email).first()

if user:
    user.role = 'customer'
    user.is_active = True
    user.is_blocked = False
    user.save()
    print(f"SUCCESS: {email} updated to 'customer'. You can now login on the user page.")
else:
    print(f"ERROR: User {email} not found.")
