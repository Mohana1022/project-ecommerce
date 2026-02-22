import os
import django
import traceback
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ShopSphere.settings')
django.setup()

from vendor.api_views import VendorOrdersListView
from user.models import AuthUser
from vendor.models import VendorProfile
from rest_framework.test import APIRequestFactory

with open('debug_traceback.txt', 'w') as f:
    try:
        vendor = VendorProfile.objects.get(id=1)
        user = vendor.user
        factory = APIRequestFactory()
        request = factory.get('/api/vendor/lifecycle-orders/')
        request.user = user
        view = VendorOrdersListView.as_view()
        response = view(request)
        f.write(f"Status: {response.status_code}\n")
        if hasattr(response, 'data'):
            f.write(f"Data length: {len(response.data)}\n")
        else:
            f.write(str(response.render().content))
    except Exception as e:
        traceback.print_exc(file=f)
