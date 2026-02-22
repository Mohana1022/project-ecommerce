"""
deliveryAgent/services.py
Auto-assignment service: matches a confirmed order to the best available
delivery agent in the same city or service area.
"""
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import DeliveryAgentProfile, DeliveryAssignment, DeliveryTracking


import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    if None in [lat1, lon1, lat2, lon2]:
        return float('inf')
        
    # convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    return c * r

def auto_assign_order(order):
    """
    Try to auto-assign `order` to the best available delivery agent.

    Matching criteria:
      1. Pincode Match (Tier 1)
      2. City Match (Tier 2)
      
    Priority within Tiers:
      - Physical Proximity (if coordinates available)
      - Workload (fewest active assignments)
    """
    # ── Determine delivery city from order ──────────────────────────────────
    delivery_address = getattr(order, 'delivery_address', None)
    if not delivery_address:
        return None

    delivery_city = (delivery_address.city or '').strip().lower()
    delivery_state = (delivery_address.state or '').strip().lower()
    delivery_pincode = (delivery_address.pincode or '').strip()
    delivery_lat = delivery_address.latitude
    delivery_lon = delivery_address.longitude

    if not delivery_city:
        return None

    # ── Guard: already has an assignment ────────────────────────────────────
    if DeliveryAssignment.objects.filter(order=order).exists():
        return None

    # ── Find all eligible agents ─────────────────────────────────────────
    candidates = DeliveryAgentProfile.objects.filter(
        approval_status='approved',
        availability_status='available',
        is_blocked=False,
        is_active=True,
    )

    matched_pincode = []  # Tier 1: Exact Pincode
    matched_region = []   # Tier 2: Same Pincode Region (First 3 digits)
    matched_city = []     # Tier 3: Same City

    for agent in candidates:
        agent_city = (agent.city or '').strip().lower()
        service_cities = [c.strip().lower() for c in (agent.service_cities or []) if c]
        service_pincodes = [str(p).strip() for p in (agent.service_pincodes or []) if p]
        
        # 1. Check Exact Pincode Match
        pincode_match = delivery_pincode in service_pincodes or agent.postal_code == delivery_pincode
        
        # 2. Check Regional Match (First 3 digits of Pincode)
        region_match = False
        if not pincode_match and len(delivery_pincode) >= 3:
            delivery_prefix = delivery_pincode[:3]
            agent_prefixes = [p[:3] for p in service_pincodes if len(p) >= 3]
            region_match = delivery_prefix in agent_prefixes or (agent.postal_code or '')[:3] == delivery_prefix

        # 3. Check City/State Match
        city_match = (
            agent_city == delivery_city
            or delivery_city in service_cities
            or delivery_state in service_cities
        )

        if pincode_match or region_match or city_match:
            active_count = DeliveryAssignment.objects.filter(
                agent=agent,
                status__in=['assigned', 'accepted', 'picked_up', 'in_transit']
            ).count()
            
            # Calculate distance if coordinates available
            distance = haversine_distance(delivery_lat, delivery_lon, agent.latitude, agent.longitude)
            
            # Tiered assignment
            if pincode_match:
                matched_pincode.append((agent, distance, active_count))
            elif region_match:
                matched_region.append((agent, distance, active_count))
            else:
                matched_city.append((agent, distance, active_count))

    # Selection Priority: Tier 1 > Tier 2 > Tier 3
    if matched_pincode:
        tier_candidates = matched_pincode
    elif matched_region:
        tier_candidates = matched_region
    else:
        tier_candidates = matched_city

    if not tier_candidates:
        return None

    # Sort logic: 
    # 1. Proximity (Distance) if coordinate exists (distance != inf)
    # 2. Number of active orders (Load balance)
    tier_candidates.sort(key=lambda x: (x[1], x[2]))
    best_agent = tier_candidates[0][0]

    # ── Compute delivery fee ─────────────────────────────────────────────────
    # Simple rule: ₹50 base, +₹30 if out-of-city vs agent's primary city
    is_same_city = (best_agent.city or '').strip().lower() == delivery_city
    delivery_fee = Decimal('50.00') if is_same_city else Decimal('80.00')

    # ── Build assignment ─────────────────────────────────────────────────────
    estimated_date = timezone.now().date() + timedelta(days=2)

    # Build pickup address from order vendor(s)
    # Use first item's vendor shop address if available
    pickup_address = "Vendor Warehouse"
    try:
        first_item = order.items.select_related('vendor').first()
        if first_item and first_item.vendor:
            v = first_item.vendor
            pickup_address = f"{v.shop_name}, {v.address or ''}"
    except Exception:
        pass

    delivery_addr_text = (
        f"{delivery_address.address_line1}, "
        f"{delivery_address.city}, "
        f"{delivery_address.state} - {delivery_address.pincode}"
    )

    assignment = DeliveryAssignment.objects.create(
        agent=best_agent,
        order=order,
        status='assigned',
        pickup_address=pickup_address,
        delivery_address=delivery_addr_text,
        delivery_city=delivery_address.city,
        estimated_delivery_date=estimated_date,
        delivery_fee=delivery_fee,
        customer_contact=delivery_address.phone or '',
    )

    # First tracking record
    DeliveryTracking.objects.create(
        delivery_assignment=assignment,
        latitude=0,
        longitude=0,
        address=f"Assigned – {delivery_address.city}",
        status='Order Assigned to Agent',
        notes=f"Auto-assigned to {best_agent.user.username} for delivery to {delivery_address.city}",
    )

    # Update order status to confirmed
    order.status = 'confirmed'
    order.save(update_fields=['status'])

    return assignment


def get_unassigned_confirmed_orders():
    """
    Return queryset of confirmed/paid orders that have no DeliveryAssignment yet.
    Useful for admin dashboard to see orders needing manual assignment.
    """
    from user.models import Order
    from django.db.models import Q

    assigned_order_ids = DeliveryAssignment.objects.values_list('order_id', flat=True)
    return Order.objects.filter(
        payment_status='completed'
    ).exclude(
        id__in=assigned_order_ids
    ).select_related('delivery_address').order_by('-created_at')
