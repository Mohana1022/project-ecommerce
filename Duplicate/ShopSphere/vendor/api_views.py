from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.db import transaction as db_transaction
from decimal import Decimal
from .models import VendorProfile, Product, ProductImage
from .serializers import (
    UserSerializer, UserRegistrationSerializer, LoginSerializer,
    VendorProfileSerializer, VendorRegistrationSerializer,
    ProductSerializer, ProductCreateUpdateSerializer, ProductListSerializer,
    VendorOrderItemSerializer, VendorOrderItemStatusUpdateSerializer
)
from superAdmin.models import CommissionSetting
from finance.services import FinanceService
from user.models import OrderItem, Order, OrderStatusHistory

User = get_user_model()

def get_vendor_or_none(user):
    """Helper to get vendor profile or return None"""
    try:
        return VendorProfile.objects.get(user=user)
    except VendorProfile.DoesNotExist:
        return None

class RegisterView(generics.CreateAPIView):
    """Vendor registration endpoint"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        from django.db import transaction
        
        # Check if this is an atomic registration (user + vendor profile)
        is_atomic = 'shop_name' in request.data or 'storeName' in request.data
        
        if is_atomic:
            try:
                with transaction.atomic():
                    # 1. Get or Create User
                    if request.user.is_authenticated:
                        user = request.user
                    else:
                        serializer = self.get_serializer(data=request.data)
                        serializer.is_valid(raise_exception=True)
                        user = serializer.save()
                    
                    # 2. Get Vendor Data
                    data = request.data
                    id_proof = request.FILES.get('id_proof_file')
                    pan_card = request.FILES.get('pan_card_file')
                    
                    # 3. Create Vendor Profile
                    if VendorProfile.objects.filter(user=user).exists():
                        return Response({'error': 'Vendor profile already exists for this user.'}, status=status.HTTP_400_BAD_REQUEST)

                    VendorProfile.objects.create(
                        user=user,
                        shop_name=data.get('shop_name', data.get('storeName', '')),
                        shop_description=data.get('shop_description', data.get('shopDescription', '')),
                        address=data.get('address', data.get('shippingAddress', '')),
                        business_type=data.get('business_type', data.get('businessType', 'retail')),
                        gst_number=data.get('gst_number', data.get('gstNumber', '')),
                        pan_number=data.get('pan_number', data.get('panNumber', '')),
                        pan_name=data.get('pan_name', data.get('panName', '')),
                        id_type=data.get('id_type', data.get('idType', 'gst')),
                        id_number=data.get('id_number', data.get('idNumber', '')),
                        bank_holder_name=data.get('bank_holder_name', ''),
                        bank_account_number=data.get('bank_account_number', ''),
                        bank_ifsc_code=data.get('bank_ifsc_code', ''),
                        shipping_fee=data.get('shipping_fee') if data.get('shipping_fee') else 0.00,
                        
                        # Save ID Proof as binary
                        id_proof_data=id_proof.read() if id_proof else None,
                        id_proof_mimetype=id_proof.content_type if id_proof else None,
                        id_proof_filename=id_proof.name if id_proof else None,
                        
                        # Save PAN Card as binary
                        pan_card_data=pan_card.read() if pan_card else None,
                        pan_card_mimetype=pan_card.content_type if pan_card else None,
                        pan_card_filename=pan_card.name if pan_card else None,

                        approval_status='pending'
                    )
                    
                    return Response({
                        'success': True,
                        'message': 'Registration submitted! Details have been sent to the Admin for approval.',
                        'user_id': user.id
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Standard user-only registration
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User registered successfully',
            'user_id': user.id,
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """Vendor login endpoint"""
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        
        if user is None:
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        
        # Check if vendor profile exists
        vendor = VendorProfile.objects.filter(user=user).first()
        
        return Response({
            'message': 'Login successful',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'vendor': {
                'id': vendor.id,
                'status': vendor.approval_status,
                'is_blocked': vendor.is_blocked
            } if vendor else None
        }, status=status.HTTP_200_OK)


class VendorDetailsView(generics.GenericAPIView):
    """Submit vendor shop details - Returns HTML page"""
    permission_classes = [AllowAny]  # Allow access for new vendors during registration
    serializer_class = VendorRegistrationSerializer
    
    def get(self, request, *args, **kwargs):
        """Render HTML form for vendor details"""
        
        # Check if user is coming from registration (has vendor_user_id in session)
        vendor_user_id = request.session.get('vendor_user_id')
        if not vendor_user_id:
            # If authenticated via API token, use that user
            if request.user.is_authenticated:
                return render(request, 'vendor/vendor_details.html')
            else:
                return redirect('register')
        
        return render(request, 'vendor/vendor_details.html')
    
    def post(self, request, *args, **kwargs):
        """Process vendor details form submission"""
        
        # Get user from session or from authenticated request
        vendor_user_id = request.session.get('vendor_user_id')
        if vendor_user_id:
            user = get_object_or_404(User, id=vendor_user_id)
        elif request.user.is_authenticated:
            user = request.user
        else:
            return redirect('register')
        
        # Check if vendor profile already exists
        vendor = VendorProfile.objects.filter(user=user).first()
        
        if vendor:
            return render(request, 'vendor/vendor_details.html', {
                'error': 'Vendor profile already exists'
            })
        
        id_proof = request.FILES.get('id_proof_file')
        pan_card = request.FILES.get('pan_card_file')

        # Create vendor profile from form data
        VendorProfile.objects.create(
            user=user,
            shop_name=request.POST.get('shop_name'),
            shop_description=request.POST.get('shop_description'),
            address=request.POST.get('address'),
            business_type=request.POST.get('business_type'),
            id_type=request.POST.get('id_type'),
            id_number=request.POST.get('id_number'),
            
            # Save ID Proof as binary
            id_proof_data=id_proof.read() if id_proof else None,
            id_proof_mimetype=id_proof.content_type if id_proof else None,
            id_proof_filename=id_proof.name if id_proof else None,
            
            # Save PAN Card as binary
            pan_card_data=pan_card.read() if pan_card else None,
            pan_card_mimetype=pan_card.content_type if pan_card else None,
            pan_card_filename=pan_card.name if pan_card else None,

            approval_status='pending'
        )
        
        # Clear session data
        if 'vendor_user_id' in request.session:
            del request.session['vendor_user_id']
        
        # Redirect to login after successful submission
        return redirect('login')


class VendorDashboardView(generics.RetrieveAPIView):
    """Get vendor dashboard information"""
    permission_classes = [IsAuthenticated]
    serializer_class = VendorProfileSerializer
    
    def get_object(self):
        return VendorProfile.objects.get(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        vendor = get_vendor_or_none(request.user)
        if not vendor:
            return Response({
                'vendor': None,
                'products_count': 0,
                'approved_products': 0,
                'pending_products': 0,
                'blocked_products': 0,
                'is_guest': True
            }, status=status.HTTP_200_OK)
        
        # Restrict access if not approved
        if vendor.approval_status != 'approved':
            return Response({
                'error': f'Vendor account {vendor.approval_status}',
                'status': vendor.approval_status,
                'reason': vendor.rejection_reason if vendor.approval_status == 'rejected' else 'Awaiting admin approval'
            }, status=status.HTTP_200_OK)
            
        if vendor.is_blocked:
            return Response({
                'error': 'Vendor account is blocked',
                'reason': vendor.blocked_reason
            }, status=status.HTTP_200_OK)
        
        products = Product.objects.filter(vendor=vendor)
        
        return Response({
            'vendor': VendorProfileSerializer(vendor).data,
            'products_count': products.count(),
            'approved_products': products.filter(status='approved').count(),
            'pending_products': products.filter(status='pending').count(),
            'blocked_products': products.filter(is_blocked=True).count(),
        }, status=status.HTTP_200_OK)


class VendorProfileDetailView(generics.RetrieveUpdateAPIView):
    """Get or update vendor profile"""
    permission_classes = [IsAuthenticated]
    serializer_class = VendorProfileSerializer
    
    def get_object(self):
        return get_vendor_or_none(self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        vendor = get_vendor_or_none(request.user)
        if not vendor:
            return Response(None, status=status.HTTP_200_OK)
        return Response(VendorProfileSerializer(vendor).data)


class ProductViewSet(viewsets.ModelViewSet):
    """CRUD operations for products"""
    permission_classes = [IsAuthenticated]
    queryset = Product.objects.all()
    pagination_class = None
    
    def get_queryset(self):
        try:
            vendor = VendorProfile.objects.get(user=self.request.user)
            if vendor.approval_status != 'approved' or vendor.is_blocked:
                return Product.objects.none()
            return Product.objects.filter(vendor=vendor)
        except VendorProfile.DoesNotExist:
            return Product.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        elif self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            vendor = VendorProfile.objects.get(user=request.user)
            if vendor.approval_status != 'approved':
                return Response({
                    'error': f'Your vendor account {vendor.approval_status}. Actions restricted.'
                }, status=status.HTTP_403_FORBIDDEN)
        except VendorProfile.DoesNotExist:
            return Response({
                'error': 'Vendor profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')

        if len(images) < 4:
            return Response({
                'error': 'Minimum 4 images are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = Product.objects.create(
            vendor=vendor,
            **serializer.validated_data
        )

        for image in images:
            ProductImage.objects.create(
                product=product,
                image_data=image.read(),
                image_mimetype=image.content_type,
                image_filename=image.name
            )

        return Response(
            ProductSerializer(product).data,
            status=status.HTTP_201_CREATED
        )

    
    def list(self, request, *args, **kwargs):
        try:
            vendor = VendorProfile.objects.get(user=request.user)
        except VendorProfile.DoesNotExist:
            return Response({
                'error': 'Vendor profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        queryset = self.get_queryset()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by name or description
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    def update(self, request, *args, **kwargs):
        product = self.get_object()

        if product.vendor.user != request.user:
            return Response({
                'error': 'You do not have permission to update this product'
            }, status=status.HTTP_403_FORBIDDEN)

        images = request.FILES.getlist('images')

        serializer = self.get_serializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # If images are sent → replace old ones
        if images:
            if len(images) < 4:
                return Response({
                    'error': 'Minimum 4 images are required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            product.images.all().delete()

            for image in images:
                ProductImage.objects.create(
                    product=product,
                    image_data=image.read(),
                    image_mimetype=image.content_type,
                    image_filename=image.name
                )

        return Response(ProductSerializer(product).data)

    
    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        
        if product.vendor.user != request.user:
            return Response({
                'error': 'You do not have permission to delete this product'
            }, status=status.HTTP_403_FORBIDDEN)
        
        product.delete()
        return Response({
            'message': 'Product deleted successfully'
        }, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def approved(self, request):
        """Get only approved products"""
        queryset = self.get_queryset().filter(status='approved')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get only pending products"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def blocked(self, request):
        """Get only blocked products"""
        queryset = self.get_queryset().filter(is_blocked=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ApprovalStatusView(generics.RetrieveAPIView):
    """Get vendor approval status"""
    permission_classes = [IsAuthenticated]
    serializer_class = VendorProfileSerializer
    
    def get_object(self):
        return VendorProfile.objects.get(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            vendor = self.get_object()
            return Response({
                'approval_status': vendor.approval_status,
                'is_blocked': vendor.is_blocked,
                'rejection_reason': vendor.rejection_reason,
                'blocked_reason': vendor.blocked_reason
            })
        except VendorProfile.DoesNotExist:
            return Response({
                'error': 'Vendor profile not found'
            }, status=status.HTTP_404_NOT_FOUND)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class VendorOrderListView(generics.ListAPIView):
    """List orders containing products from the current vendor"""
    permission_classes = [IsAuthenticated]
    serializer_class = VendorOrderItemSerializer
    pagination_class = None

    def get_queryset(self):
        vendor = get_object_or_404(VendorProfile, user=self.request.user)
        return OrderItem.objects.filter(vendor=vendor)


class VendorOrderItemUpdateView(generics.UpdateAPIView):
    """Update the status of an order item by the vendor"""
    permission_classes = [IsAuthenticated]
    serializer_class = VendorOrderItemStatusUpdateSerializer

    def get_queryset(self):
        vendor = get_object_or_404(VendorProfile, user=self.request.user)
        return OrderItem.objects.filter(vendor=vendor)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.vendor_status == 'shipped':
            # 1. Trigger auto-assignment if not already assigned
            try:
                from deliveryAgent.services import auto_assign_order
                auto_assign_order(instance.order)
            except Exception:
                pass
            
            # 2. Update overall order status to 'shipping' if it's confirmed
            order = instance.order
            if order.status == 'confirmed':
                order.status = 'shipping'
                order.save(update_fields=['status'])


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([AllowAny])
def serve_product_image(request, image_id):
    """
    Serve product image directly from BinaryField in the database.
    Only fetches from DB; fallback to file is removed.
    """
    product_image = get_object_or_404(ProductImage, id=image_id)
    
    if not product_image.image_data:
        return Response({'error': 'Image data not found in database'}, status=status.HTTP_404_NOT_FOUND)
    
    return HttpResponse(
        bytes(product_image.image_data),
        content_type=product_image.image_mimetype or 'image/jpeg'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def serve_vendor_id_proof(request, vendor_id):
    """Serve vendor ID proof directly from BinaryField"""
    vendor = get_object_or_404(VendorProfile, id=vendor_id)
    if not vendor.id_proof_data:
        return Response({'error': 'ID proof data not found'}, status=status.HTTP_404_NOT_FOUND)
    data = vendor.id_proof_data
    if isinstance(data, memoryview):
        data = data.tobytes()
    return HttpResponse(
        data,
        content_type=vendor.id_proof_mimetype or 'application/pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def serve_vendor_pan_card(request, vendor_id):
    """Serve vendor PAN card directly from BinaryField"""
    vendor = get_object_or_404(VendorProfile, id=vendor_id)
    if not vendor.pan_card_data:
        return Response({'error': 'PAN card data not found'}, status=status.HTTP_404_NOT_FOUND)
    data = vendor.pan_card_data
    if isinstance(data, memoryview):
        data = data.tobytes()
    return HttpResponse(
        data,
        content_type=vendor.pan_card_mimetype or 'application/pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def serve_vendor_selfie(request, vendor_id):
    """Serve vendor Selfie with ID directly from BinaryField"""
    vendor = get_object_or_404(VendorProfile, id=vendor_id)
    if not vendor.selfie_with_id_data:
        return Response({'error': 'Selfie data not found'}, status=status.HTTP_404_NOT_FOUND)
    data = vendor.selfie_with_id_data
    if isinstance(data, memoryview):
        data = data.tobytes()
    return HttpResponse(
        data,
        content_type=vendor.selfie_with_id_mimetype or 'image/jpeg'
    )


class VendorEarningsView(generics.GenericAPIView):
    """Get vendor earnings profile and recent activities"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor = get_object_or_404(VendorProfile, user=request.user)
        summary = FinanceService.get_vendor_earnings_summary(vendor)
        return Response(summary)


class VendorEarningsAnalyticsView(generics.GenericAPIView):
    """Get vendor earnings chart data based on time filter"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor = get_object_or_404(VendorProfile, user=request.user)
        time_filter = request.query_params.get('filter', 'weekly')
        data = FinanceService.get_vendor_earnings_analytics(vendor, time_filter)
        return Response(data)


class CommissionInfoView(generics.GenericAPIView):
    """Get platform commission rates and category overrides"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        global_rate = CommissionSetting.objects.filter(category__isnull=True, is_active=True).first()
        overrides = CommissionSetting.objects.filter(category__isnull=False, is_active=True)
        
        return Response({
            'global_rate': {
                'commission_type': global_rate.commission_type if global_rate else 'percentage',
                'percentage': float(global_rate.percentage) if global_rate else 10.0,
                'basic_fee': float(global_rate.basic_fee) if global_rate else 0.0,
            },
            'category_overrides': [
                {
                    'id': c.id,
                    'category': c.category,
                    'category_display': str(c),
                    'commission_type': c.commission_type,
                    'percentage': float(c.percentage),
                    'basic_fee': float(c.basic_fee),
                } for c in overrides
            ]
        })


# ===============================================
#   VENDOR ORDER LIFECYCLE MANAGEMENT
# ===============================================

class VendorOrdersListView(generics.ListAPIView):
    """
    GET /api/vendor/lifecycle-orders/
    Returns all order items belonging to this vendor, grouped/enriched with
    the parent order status.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VendorOrderItemSerializer
    pagination_class = None

    def get_queryset(self):
        vendor = get_vendor_or_none(self.request.user)
        if not vendor:
            return OrderItem.objects.none()

        qs = OrderItem.objects.filter(vendor=vendor).select_related(
            'order', 'order__user', 'order__delivery_address', 'product'
        ).order_by('-order__created_at')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(order__status=status_filter)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # Serialize and enrich with order-level status
        result = []
        for item in qs:
            data = VendorOrderItemSerializer(item, context={'request': request}).data
            data['order_status'] = item.order.status
            data['order_created_at'] = item.order.created_at.isoformat()
            data['order_pk'] = item.order.pk
            data['customer_email'] = item.order.user.email
            data['customer_name'] = item.order.user.get_full_name() or item.order.user.username
            data['payment_status'] = item.order.payment_status
            data['invoice_number'] = f"INV-{item.order.order_number}"  # Simple invoice number generation
            result.append(data)
        return Response(result)


class VendorOrderActionView(generics.GenericAPIView):
    """
    POST /api/vendor/lifecycle-orders/<order_pk>/action/
    Body: { "action": "approve" | "reject" | "pack", "notes": "..." }

    Lifecycle transitions allowed for vendor:
      pending          → approve  → order.status = approved
      pending          → reject   → order.status = rejected  (needs notes/reason)
      approved         → pack     → order.status = packed + auto-assign delivery agent
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_pk):
        vendor = get_vendor_or_none(request.user)
        if not vendor:
            return Response({'error': 'You do not have a vendor profile.'}, status=status.HTTP_403_FORBIDDEN)
            
        order = get_object_or_404(Order, pk=order_pk)

        # Ensure this vendor has items in this order
        has_items = OrderItem.objects.filter(order=order, vendor=vendor).exists()
        if not has_items:
            return Response({'error': 'You have no items in this order.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', '').strip().lower()
        notes = request.data.get('notes', '').strip()

        # ── Permission per transition ──────────────────────────────────────────
        if action == 'approve':
            if order.status != 'pending':
                return Response({'error': f'Cannot approve an order in status: {order.status}'}, status=400)
            order.status = 'approved'
            order.save(update_fields=['status'])
            log_note = notes or 'Order approved by vendor.'

        elif action == 'reject':
            if order.status not in ('pending', 'approved'):
                return Response({'error': f'Cannot reject an order in status: {order.status}'}, status=400)
            if not notes:
                return Response({'error': 'A rejection reason is required.'}, status=400)

            # Restore stock if rejected
            from django.db import transaction as db_transaction
            with db_transaction.atomic():
                vendor_items = OrderItem.objects.filter(order=order, vendor=vendor).select_related('product')
                for item in vendor_items:
                    if item.product:
                        prod = item.product
                        prod.quantity += item.quantity
                        prod.save(update_fields=['quantity'])
            
            order.status = 'rejected'
            order.save(update_fields=['status'])
            log_note = notes

        elif action == 'pack':
            if order.status != 'approved':
                return Response({'error': f'Order must be approved before packing. Current: {order.status}'}, status=400)

            # Update vendor order items status
            vendor_items = OrderItem.objects.filter(order=order, vendor=vendor)
            vendor_items.update(vendor_status='shipped')

            order.status = 'packed'
            order.save(update_fields=['status'])

            log_note = notes or 'Order packed and ready for delivery.'

            # Auto-assign delivery agent
            try:
                from deliveryAgent.services import auto_assign_order
                assignment = auto_assign_order(order)
                if assignment:
                    log_note += f' Delivery assigned to agent #{assignment.agent.id}.'
            except Exception as e:
                log_note += f' Auto-assignment failed: {str(e)}'

        else:
            return Response({'error': f'Unknown action: {action}. Use approve/reject/pack.'}, status=400)

        # ── Log status history ─────────────────────────────────────────────────
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            changed_by=request.user,
            notes=log_note,
        )

        # ── Notify customer ────────────────────────────────────────────────────
        try:
            from user.models import Notification
            status_messages = {
                'approved': (
                    '✅ Order Approved',
                    f'Great news! Your order #{order.order_number} has been approved by the vendor and is being prepared.'
                ),
                'rejected': (
                    '❌ Order Rejected',
                    f'Unfortunately, your order #{order.order_number} was rejected by the vendor. Reason: {notes}'
                ),
                'packed': (
                    '📦 Order Packed',
                    f'Your order #{order.order_number} is packed and a delivery agent is being assigned!'
                ),
            }
            title, msg = status_messages.get(order.status, ('Order Update', f'Your order #{order.order_number} status: {order.status}'))
            Notification.objects.create(
                user=order.user,
                notification_type='order',
                title=title,
                message=msg,
                related_order=order,
            )
        except Exception:
            pass

        return Response({
            'message': f'Order {action}d successfully.',
            'order_status': order.status,
            'order_number': order.order_number,
        }, status=status.HTTP_200_OK)

class VendorWithdrawView(generics.GenericAPIView):
    """Processes a withdrawal request from the vendor wallet"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        vendor = get_object_or_404(VendorProfile, user=request.user)
        amount = request.data.get('amount')
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            amount_dec = Decimal(str(amount))
        except:
            return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)
            
        if amount_dec <= 0:
            return Response({'error': 'Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
            
        from user.models import UserWallet
        wallet, _ = UserWallet.objects.get_or_create(user=request.user)
        
        if wallet.balance < amount_dec:
            return Response({'error': f'Insufficient balance. Your balance is ₹{wallet.balance}'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with db_transaction.atomic():
                wallet.deduct_balance(
                    amount_dec, 
                    description=f"Withdrawal request of ₹{amount_dec}"
                )
                
                from finance.models import LedgerEntry
                LedgerEntry.objects.create(
                    vendor=vendor,
                    amount=amount_dec,
                    entry_type='debit',
                    description=f"Withdrawal: Requested amount ₹{amount_dec}"
                )
                
                return Response({
                    'message': 'Withdrawal processed successfully',
                    'new_balance': float(wallet.balance)
                })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
