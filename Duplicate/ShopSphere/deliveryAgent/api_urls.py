from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    DeliveryAgentDashboardView, DeliveryAssignmentViewSet,
    DeliveryTrackingViewSet, DeliveryEarningsViewSet,
    DeliveryPaymentViewSet, DeliveryDailyStatsViewSet,
    DeliveryFeedbackViewSet, DeliveryAgentProfileViewSet,
    UpdateOrderStatusView,
    serve_agent_vehicle_registration, serve_agent_vehicle_insurance,
    serve_agent_license, serve_agent_id_proof,
    serve_delivery_signature, serve_delivery_photo
)
from .order_lifecycle_views import (
    NearbyOTPView,
    VerifyDeliveryOTPView,
    CustomerOrderTrackingView,
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'assignments', DeliveryAssignmentViewSet, basename='delivery-assignment')
router.register(r'tracking', DeliveryTrackingViewSet, basename='delivery-tracking')
router.register(r'earnings', DeliveryEarningsViewSet, basename='delivery-earnings')
router.register(r'payments', DeliveryPaymentViewSet, basename='delivery-payment')
router.register(r'daily-stats', DeliveryDailyStatsViewSet, basename='delivery-stats')
router.register(r'feedback', DeliveryFeedbackViewSet, basename='delivery-feedback')
router.register(r'profiles', DeliveryAgentProfileViewSet, basename='delivery-profile')

urlpatterns = [
    # Binary Serving
    path('agent-vehicle-registration/<int:agent_id>/', serve_agent_vehicle_registration, name='serve_agent_vehicle_registration'),
    path('agent-vehicle-insurance/<int:agent_id>/', serve_agent_vehicle_insurance, name='serve_agent_vehicle_insurance'),
    path('agent-license/<int:agent_id>/', serve_agent_license, name='serve_agent_license'),
    path('agent-id-proof/<int:agent_id>/', serve_agent_id_proof, name='serve_agent_id_proof'),
    path('delivery-signature/<int:assignment_id>/', serve_delivery_signature, name='serve_delivery_signature'),
    path('delivery-photo/<int:assignment_id>/', serve_delivery_photo, name='serve_delivery_photo'),

    # Dashboard
    path('dashboard/', DeliveryAgentDashboardView.as_view(), name='delivery_dashboard'),
    
    # Profile fetch
    path('profiles/get_agent/', DeliveryAgentProfileViewSet.as_view({'get': 'get_agent'}), name='delivery_get_agent'),
    
    # Custom registration path for easier access
    path('register/', DeliveryAgentProfileViewSet.as_view({'post': 'register'}), name='delivery_register'),

    # Update order status (pickup / in_transit / failed)
    path('assignments/<int:pk>/update-status/', UpdateOrderStatusView.as_view(), name='update_order_status'),

    # ── Nearby OTP trigger (delivery agent signals proximity, OTP sent to customer)
    path('assignments/<int:pk>/nearby/', NearbyOTPView.as_view(), name='delivery_nearby_otp'),

    # ── Verify OTP entered by customer to confirm delivery
    path('assignments/<int:pk>/verify-otp/', VerifyDeliveryOTPView.as_view(), name='delivery_verify_otp'),

    # ── Customer order tracking API
    path('track/<str:order_number>/', CustomerOrderTrackingView.as_view(), name='customer_order_tracking'),
    
    # Routed endpoints
    path('', include(router.urls)),
]
