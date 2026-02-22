import os, sys, traceback
os.environ['DJANGO_SETTINGS_MODULE'] = 'ShopSphere.settings'
import django
django.setup()

modules_to_check = [
    'superAdmin.models',
    'superAdmin.serializers',
    'superAdmin.api_views',
    'superAdmin.api_urls',
    'deliveryAgent.serializers',
    'user.serializers',
]

for mod in modules_to_check:
    try:
        __import__(mod)
        print(f"OK: {mod}")
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"ERROR: {mod}")
        print(f"{'='*60}")
        traceback.print_exc()
        print()
