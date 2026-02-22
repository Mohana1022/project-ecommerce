from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    RegisterView, LoginView, VendorDetailsView, VendorDashboardView,
    VendorProfileDetailView, ProductViewSet, ApprovalStatusView, UserProfileView,
    VendorOrderListView, VendorOrderItemUpdateView, serve_product_image,
    serve_vendor_id_proof, serve_vendor_pan_card, serve_vendor_selfie,
    VendorEarningsView, VendorEarningsAnalyticsView, CommissionInfoView,
    VendorOrdersListView, VendorOrderActionView, VendorWithdrawView
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    # Image serving
    path('product-images/<int:image_id>/', serve_product_image, name='serve_product_image'),
    path('vendor-id-proof/<int:vendor_id>/', serve_vendor_id_proof, name='serve_vendor_id_proof'),
    path('vendor-pan-card/<int:vendor_id>/', serve_vendor_pan_card, name='serve_vendor_pan_card'),
    path('vendor-selfie/<int:vendor_id>/', serve_vendor_selfie, name='serve_vendor_selfie'),
    
    # Authentication
    path('register/', RegisterView.as_view(), name='api_register'),
    path('login/', LoginView.as_view(), name='api_login'),
    
    # Profile & Status
    path('profile/', VendorProfileDetailView.as_view(), name='api_vendor_profile'),
    path('details/', VendorDetailsView.as_view(), name='api_vendor_details'),
    path('approval-status/', ApprovalStatusView.as_view(), name='api_approval_status'),
    path('user/profile/', UserProfileView.as_view(), name='user_profile'),
    
    # Dashboard & Analytics
    path('dashboard/', VendorDashboardView.as_view(), name='api_vendor_dashboard'),
    path('earnings-summary/', VendorEarningsView.as_view(), name='api_vendor_earnings'),
    path('earnings-analytics/', VendorEarningsAnalyticsView.as_view(), name='api_vendor_earnings_analytics'),
    path('commission-info/', CommissionInfoView.as_view(), name='api_vendor_commission_info'),
    path('withdraw/', VendorWithdrawView.as_view(), name='api_vendor_withdraw'),
    
    # Original Order Management
    path('orders/', VendorOrderListView.as_view(), name='api_vendor_orders'),
    path('orders/<int:pk>/update-status/', VendorOrderItemUpdateView.as_view(), name='api_vendor_order_update'),
    
    # ── New Lifecycle Order Management ──────────────────────────────────────
    path('lifecycle-orders/', VendorOrdersListView.as_view(), name='api_vendor_lifecycle_orders'),
    path('lifecycle-orders/<int:order_pk>/action/', VendorOrderActionView.as_view(), name='api_vendor_order_action'),
    
    # Products (using router)
    path('', include(router.urls)),
]