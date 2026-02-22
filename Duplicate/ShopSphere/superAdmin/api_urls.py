from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    VendorRequestViewSet, VendorManagementViewSet, ProductManagementViewSet,
    DeliveryRequestViewSet, DeliveryAgentManagementViewSet, DashboardView,
    CommissionSettingsViewSet, ReportsView,
    UserManagementView, UserBlockToggleView,
    TriggerAssignmentView, UnassignedOrdersView,
    AdminOrderTrackingViewSet, AdminOrderViewSet,
    SettlePaymentView,
)

router = DefaultRouter()
router.register(r'vendor-requests', VendorRequestViewSet, basename='vendor_request')
router.register(r'vendors', VendorManagementViewSet, basename='vendor_management')
router.register(r'products', ProductManagementViewSet, basename='product_management')
router.register(r'delivery-requests', DeliveryRequestViewSet, basename='delivery_request')
router.register(r'delivery-agents', DeliveryAgentManagementViewSet, basename='delivery_agent')
router.register(r'commission-settings', CommissionSettingsViewSet, basename='commission_settings')
router.register(r'tracking', AdminOrderTrackingViewSet, basename='order_tracking')
router.register(r'orders', AdminOrderViewSet, basename='admin_orders')


urlpatterns = [
    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='admin_dashboard_api'),
    path('reports/', ReportsView.as_view(), name='admin_reports_api'),

    # User management
    path('users/', UserManagementView.as_view(), name='admin_users_list'),
    path('users/<int:pk>/toggle-block/', UserBlockToggleView.as_view(), name='admin_user_toggle_block'),

    # Delivery assignment management
    path('trigger-assignment/<int:order_id>/', TriggerAssignmentView.as_view(), name='trigger_assignment'),
    path('unassigned-orders/', UnassignedOrdersView.as_view(), name='unassigned_orders'),
    path('settle-payment/<int:order_item_id>/', SettlePaymentView.as_view(), name='settle_payment'),

    # Router endpoints
    path('', include(router.urls)),
]

