import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ShopSphere.settings')
django.setup()

from user.models import AuthUser

users = AuthUser.objects.all().values('email', 'username', 'role', 'is_active', 'is_blocked')
print("Total Users:", len(users))
for user in users:
    print(f"Email: {user['email']}, Username: {user['username']}, Role: {user['role']}, Active: {user['is_active']}, Blocked: {user['is_blocked']}")
