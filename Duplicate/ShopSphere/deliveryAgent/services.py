"""
deliveryAgent/services.py

Auto-assignment of orders to the nearest available delivery agent.
Uses the Haversine formula to calculate geodesic distance.
"""
import math
import random
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone


def haversine_km(lat1, lon1, lat2, lon2):
    """Return the great-circle distance (km) between two GPS coordinates."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def auto_assign_order(order):
    """
    Find the nearest available approved delivery agent and create a
    DeliveryAssignment for the given order.

    Returns the created DeliveryAssignment, or None if no agent found.
    """
    from .models import DeliveryAgentProfile, DeliveryAssignment

    # Delivery address coordinates from order (if stored)
    delivery_coords = {}
    try:
        if hasattr(order, 'delivery_assignment'):
            # Already assigned – nothing to do
            return order.delivery_assignment
    except Exception:
        pass

    # Candidate agents: approved, available, not blocked
    candidates = DeliveryAgentProfile.objects.filter(
        approval_status='approved',
        availability_status='available',
        is_blocked=False,
        latitude__isnull=False,
        longitude__isnull=False,
    )

    if not candidates.exists():
        # Fallback: pick any approved agent even if unavailable
        candidates = DeliveryAgentProfile.objects.filter(
            approval_status='approved',
            is_blocked=False,
        )
        if not candidates.exists():
            return None

    # Try to get order delivery coordinates
    dest_lat, dest_lon = None, None
    if order.delivery_address:
        # In a real system you'd geocode the address; for now use agent city matching
        pass

    # Sort by distance if we have destination coordinates; otherwise random
    best_agent = None
    if dest_lat and dest_lon:
        min_dist = float('inf')
        for agent in candidates:
            if agent.latitude and agent.longitude:
                dist = haversine_km(agent.latitude, agent.longitude, dest_lat, dest_lon)
                if dist < min_dist:
                    min_dist = dist
                    best_agent = agent
    else:
        # No coordinates available – pick the first available agent
        best_agent = candidates.first()

    if not best_agent:
        return None

    # Build address string
    address = order.delivery_address
    addr_str = (
        f"{address.address_line1}, {address.city}, {address.state} - {address.pincode}"
        if address else "Address on file"
    )

    # Create the assignment
    otp = f"{random.randint(100000, 999999)}"
    assignment = DeliveryAssignment.objects.create(
        agent=best_agent,
        order=order,
        status='assigned',
        pickup_address=f"{best_agent.address}, {best_agent.city}",
        delivery_address=addr_str,
        delivery_city=address.city if address else best_agent.city,
        delivery_coordinates={},
        estimated_delivery_date=timezone.now().date() + timedelta(days=2),
        delivery_fee=Decimal('50.00'),
        customer_contact=address.phone if address else '',
        otp_code=otp,
    )

    # Mark agent as on_delivery
    best_agent.availability_status = 'on_delivery'
    best_agent.save(update_fields=['availability_status'])

    # Update order status to delivery_assigned
    order.status = 'delivery_assigned'
    order.delivery_agent = best_agent
    order.save(update_fields=['status', 'delivery_agent'])

    # Log status history
    try:
        from user.models import OrderStatusHistory
        OrderStatusHistory.objects.create(
            order=order,
            status='delivery_assigned',
            notes=f"Auto-assigned to delivery agent: {best_agent.user.get_full_name() or best_agent.user.username}",
        )
    except Exception:
        pass

    # Notify customer
    try:
        from user.models import Notification
        agent_name = best_agent.user.get_full_name() or best_agent.user.username
        
        Notification.objects.create(
            user=order.user,
            notification_type='delivery',
            title='🚚 Delivery Agent Assigned',
            message=(
                f'A delivery agent has been assigned for your order #{order.order_number}. '
                f'Agent: {agent_name}.'
            ),
            related_order=order,
        )

        # Notify associated Vendors
        vendor_ids = order.items.values_list('vendor__user_id', flat=True).distinct()
        for v_user_id in vendor_ids:
            if v_user_id:
                Notification.objects.create(
                    user_id=v_user_id,
                    notification_type='delivery',
                    title='📦 Delivery Agent Assigned for Order',
                    message=(
                        f'Delivery agent {agent_name} ({best_agent.phone_number}) has been assigned '
                        f'to pick up items for order #{order.order_number}.'
                    ),
                    related_order=order,
                )
                
        # Notify Admins (Superusers)
        from django.contrib.auth import get_user_model
        AdminUser = get_user_model()
        admins = AdminUser.objects.filter(is_superuser=True)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                notification_type='delivery',
                title='🛡️ Agent Assigned (Admin)',
                message=f'Agent {agent_name} assigned to order #{order.order_number}.',
                related_order=order,
            )
            
    except Exception as e:
        print(f"Notification Error: {e}")

    return assignment
