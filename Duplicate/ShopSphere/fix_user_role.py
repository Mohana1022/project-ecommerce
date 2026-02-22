import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ShopSphere.settings')
django.setup()

from user.models import AuthUser

email = 'allamsudhakarr041@gmail.com'
user = AuthUser.objects.filter(email=email).first()

if user:
    user.role = 'customer'
    user.is_active = True
    user.is_blocked = False
    user.save()
    print(f"Successfully updated {email} to 'customer' role.")
else:
    # Let's check if there's a user with a similar email or just list them all to be sure
    print(f"User {email} not found. Current users:")
    for u in AuthUser.objects.all():
        print(f" - {u.email} ({u.role})")
