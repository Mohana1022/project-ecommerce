"""
deliveryAgent/order_lifecycle_views.py

Additional API views for the delivery agent order lifecycle:
  - NearbyOTPView       : Delivery agent signals "nearby" → generates & emails OTP
  - VerifyDeliveryOTPView: Delivery agent verifies OTP entered by customer → marks delivered
  - CustomerOrderTrackingView: Customer checks full order tracking status + history
"""
import math
import random
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import DeliveryAgentProfile, DeliveryAssignment


# ─────────────────────────────────────────────────────────────────────────────
class NearbyOTPView(APIView):
    """
    POST /api/delivery/assignments/<pk>/nearby/
    Body (optional): { "latitude": 12.34, "longitude": 77.56 }

    When the delivery agent is within NEARBY_RADIUS_M metres of the delivery
    address, generate/refresh the OTP, update order status to 'nearby',
    and notify the customer via email + in-app notification.
    """
    permission_classes = [IsAuthenticated]
    NEARBY_RADIUS_M = 500  # metres; tighten to 200 for production

    def post(self, request, pk):
        try:
            agent = DeliveryAgentProfile.objects.get(user=request.user)
        except DeliveryAgentProfile.DoesNotExist:
            return Response({'error': 'Agent profile not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = DeliveryAssignment.objects.select_related(
                'order', 'order__user', 'order__delivery_address'
            ).get(id=pk, agent=agent)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.status not in ('picked_up', 'in_transit', 'accepted'):
            return Response(
                {'error': f'Cannot trigger nearby from current assignment status: {assignment.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Optional distance check
        agent_lat = request.data.get('latitude')
        agent_lon = request.data.get('longitude')
        if agent_lat and agent_lon and assignment.delivery_coordinates:
            coords = assignment.delivery_coordinates
            dest_lat = coords.get('latitude')
            dest_lon = coords.get('longitude')
            if dest_lat and dest_lon:
                R = 6371000
                phi1 = math.radians(float(agent_lat))
                phi2 = math.radians(float(dest_lat))
                dphi = math.radians(float(dest_lat) - float(agent_lat))
                dlambda = math.radians(float(dest_lon) - float(agent_lon))
                a = (math.sin(dphi / 2) ** 2
                     + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
                distance_m = 2 * R * math.asin(math.sqrt(a))
                if distance_m > self.NEARBY_RADIUS_M:
                    return Response({
                        'error': (
                            f'You are not near enough to the delivery address yet. '
                            f'Get within {self.NEARBY_RADIUS_M} metres to trigger OTP.'
                        ),
                    }, status=status.HTTP_400_BAD_REQUEST)

        otp = f"{random.randint(100000, 999999)}"
        with transaction.atomic():
            assignment.otp_code = otp
            assignment.status = 'in_transit'
            assignment.save(update_fields=['otp_code', 'status'])

            order = assignment.order
            order.status = 'nearby'
            order.save(update_fields=['status'])

        # Log status history
        try:
            from user.models import OrderStatusHistory
            OrderStatusHistory.objects.create(
                order=order,
                status='nearby',
                notes='Delivery agent is nearby. OTP generated and sent to customer.',
            )
        except Exception:
            pass

        customer = order.user
        order_number = order.order_number
        otp_email_sent = False

        # In-app notification
        try:
            from user.models import Notification
            Notification.objects.create(
                user=customer,
                notification_type='delivery',
                title='🔐 Your Delivery OTP — Agent is Nearby!',
                message=(
                    f'Your delivery agent is almost at your door for order #{order_number}!\n'
                    f'Delivery OTP: {otp}\n'
                    f'Share this ONLY with the agent when you receive your package.'
                ),
                related_order=order,
            )
        except Exception:
            pass

        # Email OTP
        try:
            from django.core.mail import send_mail
            from django.conf import settings as django_settings
            send_mail(
                subject=f'[ShopSphere] 🔐 Delivery OTP — Order #{order_number}',
                message=(
                    f'Hello {customer.first_name or customer.username},\n\n'
                    f'Your delivery agent is right around the corner with order #{order_number}!\n\n'
                    f'Your one-time delivery OTP is:\n\n'
                    f'    {otp}\n\n'
                    f'Please share this OTP with the delivery agent to confirm receipt.\n'
                    f'Do NOT share this OTP with anyone else.\n\n'
                    f'Thank you for shopping with ShopSphere!'
                ),
                from_email=django_settings.EMAIL_HOST_USER,
                recipient_list=[customer.email],
                fail_silently=True,
            )
            otp_email_sent = True
        except Exception:
            pass

        return Response({
            'message': 'OTP generated and sent to customer. Order status updated to NEARBY.',
            'order_status': 'nearby',
            'otp_sent_via_email': otp_email_sent,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
class VerifyDeliveryOTPView(APIView):
    """
    POST /api/delivery/assignments/<pk>/verify-otp/
    Body: { "otp": "123456" }

    Validates the OTP provided by the customer, marks assignment as delivered,
    updates order status to 'delivered'.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            agent = DeliveryAgentProfile.objects.get(user=request.user)
        except DeliveryAgentProfile.DoesNotExist:
            return Response({'error': 'Agent profile not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = DeliveryAssignment.objects.select_related(
                'order', 'order__user'
            ).get(id=pk, agent=agent)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

        entered_otp = str(request.data.get('otp', '')).strip()
        if not entered_otp or entered_otp != str(assignment.otp_code):
            return Response(
                {'error': 'Invalid OTP. Please ask the customer for the correct OTP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                assignment.otp_verified = True
                assignment.save(update_fields=['otp_verified'])

                # use the model's built-in mark_delivered to handle status,
                # timestamps, wallet credits, and commissions.
                assignment.mark_delivered()

                # Ensure agent is back to available
                assignment.agent.availability_status = 'available'
                assignment.agent.save(update_fields=['availability_status'])

            # Log
            try:
                from user.models import OrderStatusHistory
                OrderStatusHistory.objects.create(
                    order=assignment.order, # Use assignment.order here
                    status='delivered',
                    notes='OTP verified by delivery agent. Order delivered successfully.',
                )
            except Exception:
                pass

            # Notify customer
            try:
                from user.models import Notification
                Notification.objects.create(
                    user=assignment.order.user, # Use assignment.order.user here
                    notification_type='delivery',
                    title='✅ Order Delivered!',
                    message=(
                        f'Your order #{assignment.order.order_number} has been delivered successfully. '
                        f'Thank you for shopping with ShopSphere!'
                    ),
                    related_order=assignment.order,
                )
            except Exception:
                pass

            return Response({
                'message': 'OTP verified. Order marked as delivered!',
                'order_status': 'delivered',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f"Processing Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
class CustomerOrderTrackingView(APIView):
    """
    GET /api/delivery/track/<order_number>/
    Returns full tracking info for a customer's order, accessible
    only by the authenticated order owner.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        try:
            from django.db.models import Q
            from user.models import Order
            order = Order.objects.select_related(
                'delivery_address', 'delivery_agent', 'delivery_agent__user'
            ).get(Q(order_number=order_number) | Q(transaction_id=order_number), user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Status history
        status_history = []
        try:
            from user.models import OrderStatusHistory
            for h in order.status_history.all():
                status_history.append({
                    'status': h.status,
                    'notes': h.notes,
                    'timestamp': h.timestamp.isoformat(),
                })
        except Exception:
            pass

        # Agent info
        agent_info = None
        if order.delivery_agent:
            ag = order.delivery_agent
            agent_info = {
                'name': ag.user.get_full_name() or ag.user.username,
                'phone': getattr(ag, 'phone_number', ''),
                'vehicle': getattr(ag, 'vehicle_type', ''),
                'vehicle_number': getattr(ag, 'vehicle_number', ''),
                'rating': float(getattr(ag, 'average_rating', 0)),
            }

        # Current location from assignment
        tracking_location = None
        try:
            asgmt = order.delivery_assignment
            if hasattr(asgmt, 'current_location') and asgmt.current_location:
                tracking_location = asgmt.current_location
        except Exception:
            pass

        # Delivery address string
        address = order.delivery_address
        delivery_address_str = ''
        if address:
            delivery_address_str = (
                address.address_line1
                + (f", {address.address_line2}" if getattr(address, 'address_line2', '') else '')
                + f", {address.city}, {address.state} - {address.pincode}"
            )

        return Response({
            'order_number': order.order_number,
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'total_amount': str(order.total_amount),
            'subtotal': str(order.subtotal),
            'tax_amount': str(order.tax_amount),
            'shipping_cost': str(order.shipping_cost),
            'payment_method': order.payment_method,
            'payment_status': order.payment_status,
            'invoice_number': f"INV-{order.order_number}",
            'delivery_address': delivery_address_str,
            'customer_name': order.user.get_full_name() or order.user.username,
            'customer_email': order.user.email,
            'delivery_agent': agent_info,
            'current_location': tracking_location,
            'status_history': status_history,
            'items': [
                {
                    'name': item.product_name,
                    'quantity': item.quantity,
                    'price': str(item.product_price),
                    'subtotal': str(item.subtotal),
                }
                for item in order.items.all()
            ],
        })
