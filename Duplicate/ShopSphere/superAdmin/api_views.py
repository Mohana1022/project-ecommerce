from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
# User = get_user_model() - Moved inside functions to avoid AppRegistryNotReady error

from django.db.models import Q
from vendor.models import VendorProfile, Product
from .models import VendorApprovalLog, ProductApprovalLog, DeliveryAgentApprovalLog, CommissionSetting
from deliveryAgent.models import DeliveryAgentProfile, DeliveryAssignment
from deliveryAgent.serializers import DeliveryAssignmentDetailSerializer, DeliveryAssignmentListSerializer
from .serializers import (
    VendorApprovalLogSerializer, ProductApprovalLogSerializer,
    AdminVendorDetailSerializer, AdminProductDetailSerializer,
    AdminVendorListSerializer, AdminProductListSerializer,
    ApproveVendorSerializer, RejectVendorSerializer,
    BlockVendorSerializer, UnblockVendorSerializer,
    BlockProductSerializer, UnblockProductSerializer,
    AdminDeliveryAgentDetailSerializer, AdminDeliveryAgentListSerializer,
    ApproveDeliveryAgentSerializer, RejectDeliveryAgentSerializer,
    BlockDeliveryAgentSerializer, UnblockDeliveryAgentSerializer,
    AdminOrderListSerializer, AdminOrderDetailSerializer,
    CommissionSettingSerializer
)
from user.models import Order


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class AdminLoginRequiredMixin:
    """Ensure user is admin"""
    permission_classes = [IsAuthenticated, IsAdminUser]

class VendorRequestViewSet(AdminLoginRequiredMixin, viewsets.ModelViewSet):
    """Manage vendor approval requests"""
    queryset = VendorProfile.objects.filter(approval_status='pending')
    serializer_class = AdminVendorDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        queryset = VendorProfile.objects.filter(approval_status='pending')
        
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(shop_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        serializer = AdminVendorDetailSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        vendor = self.get_object()
        
        if vendor.approval_status != 'pending':
            return Response({
                'error': 'Only pending vendors can be approved'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ApproveVendorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor.approval_status = 'approved'
        vendor.save()
        
        VendorApprovalLog.objects.create(
            vendor=vendor,
            admin_user=request.user,
            action='approved',
            reason=serializer.validated_data.get('reason', '')
        )
        
        # Send confirmation email
        try:
            user = vendor.user
            print(f"DEBUG: Attempting to send approval email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Your Vendor Account has been Approved!',
                message=f'Hello {user.username},\n\nCongratulations! Your vendor account for "{vendor.shop_name}" has been approved by the administrator. You can now login and start adding products.\n\nThank you for joining ShopSphere!',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending approval email: {str(e)}")
            pass
        
        return Response({
            'message': 'Vendor approved successfully',
            'vendor': AdminVendorDetailSerializer(vendor).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        vendor = self.get_object()
        
        if vendor.approval_status != 'pending':
            return Response({
                'error': 'Only pending vendors can be rejected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = RejectVendorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor.approval_status = 'rejected'
        vendor.rejection_reason = serializer.validated_data['reason']
        vendor.save()
        
        VendorApprovalLog.objects.create(
            vendor=vendor,
            admin_user=request.user,
            action='rejected',
            reason=serializer.validated_data['reason']
        )
        
        # Send rejection email
        try:
            user = vendor.user
            print(f"DEBUG: Attempting to send rejection email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Vendor Account Application Update',
                message=f'Hello {user.username},\n\nWe regret to inform you that your vendor account application for "{vendor.shop_name}" has been rejected.\n\nReason: {serializer.validated_data["reason"]}\n\nPlease contact support if you have any questions.\n\nRegards,\nShopSphere Team',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending rejection email: {str(e)}")
            pass
        
        return Response({
            'message': 'Vendor rejected successfully',
            'vendor': AdminVendorDetailSerializer(vendor).data
        })

class VendorManagementViewSet(AdminLoginRequiredMixin, viewsets.ModelViewSet):
    queryset = VendorProfile.objects.all()
    serializer_class = AdminVendorListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        queryset = VendorProfile.objects.all()
        
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(approval_status=status_filter)
        
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(shop_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        blocked_filter = request.query_params.get('blocked', None)
        if blocked_filter == 'true':
            queryset = queryset.filter(is_blocked=True)
        elif blocked_filter == 'false':
            queryset = queryset.filter(is_blocked=False)
        
        serializer = AdminVendorListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        vendor = self.get_object()
        serializer = AdminVendorDetailSerializer(vendor, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        vendor = self.get_object()
        serializer = AdminVendorDetailSerializer(vendor, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        vendor = self.get_object()
        
        serializer = BlockVendorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor.is_blocked = True
        vendor.blocked_reason = serializer.validated_data['reason']
        vendor.save()
        
        Product.objects.filter(vendor=vendor).update(is_blocked=True)
        
        VendorApprovalLog.objects.create(
            vendor=vendor,
            admin_user=request.user,
            action='blocked',
            reason=serializer.validated_data['reason']
        )
        
        # Send blocking email
        try:
            user = vendor.user
            print(f"DEBUG: Attempting to send blocking email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Your Vendor Account has been Blocked',
                message=f'Hello {user.username},\n\nYour vendor account for "{vendor.shop_name}" has been blocked by the administrator.\n\nReason: {serializer.validated_data["reason"]}\n\nYou will not be able to manage your shop or products while blocked. Please contact support for more details.\n\nRegards,\nShopSphere Team',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending blocking email: {str(e)}")
            pass
        
        return Response({
            'message': 'Vendor blocked successfully',
            'vendor': AdminVendorDetailSerializer(vendor, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        vendor = self.get_object()
        
        serializer = UnblockVendorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor.is_blocked = False
        vendor.blocked_reason = ''
        vendor.save()
        
        VendorApprovalLog.objects.create(
            vendor=vendor,
            admin_user=request.user,
            action='unblocked',
            reason=serializer.validated_data.get('reason', '')
        )
        
        # Send unblocking email
        try:
            user = vendor.user
            print(f"DEBUG: Attempting to send unblocking email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Your Vendor Account has been Unblocked',
                message=f'Hello {user.username},\n\nGood news! Your vendor account for "{vendor.shop_name}" has been unblocked. You can now resume your sales activities.\n\nWelcome back!\nShopSphere Team',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending unblocking email: {str(e)}")
            pass
        
        return Response({
            'message': 'Vendor unblocked successfully',
            'vendor': AdminVendorDetailSerializer(vendor, context={'request': request}).data
        })

class ProductManagementViewSet(AdminLoginRequiredMixin, viewsets.ModelViewSet):
    queryset = Product.objects.select_related('vendor').prefetch_related('images').all()
    serializer_class = AdminProductListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = None  # We handle pagination manually below

    def list(self, request, *args, **kwargs):
        from django.core.paginator import Paginator
        PAGE_SIZE = 50

        queryset = Product.objects.select_related('vendor').prefetch_related('images').all()

        # Status filter
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Blocked filter
        blocked_filter = request.query_params.get('blocked', None)
        if blocked_filter == 'true':
            queryset = queryset.filter(is_blocked=True)
        elif blocked_filter == 'false':
            queryset = queryset.filter(is_blocked=False)

        # Smart search: pure integer → exact product-ID; otherwise name / vendor name contains
        search = (request.query_params.get('search', '') or '').strip()
        if search:
            if search.isdigit():
                queryset = queryset.filter(id=int(search))
            else:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(vendor__shop_name__icontains=search)
                )

        # Vendor filter
        vendor_id = request.query_params.get('vendor_id', None)
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)

        queryset = queryset.order_by('-created_at')

        # Server-side pagination
        page_number = int(request.query_params.get('page', 1))
        paginator = Paginator(queryset, PAGE_SIZE)
        page_obj = paginator.get_page(page_number)

        serializer = AdminProductListSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number,
            'results': serializer.data,
        })
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        product = self.get_object()
        serializer = AdminProductDetailSerializer(product, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        product = self.get_object()
        
        serializer = BlockProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product.is_blocked = True
        product.blocked_reason = serializer.validated_data['reason']
        product.save()
        
        ProductApprovalLog.objects.create(
            product=product,
            admin_user=request.user,
            action='blocked',
            reason=serializer.validated_data['reason']
        )
        
        return Response({
            'message': 'Product blocked successfully',
            'product': AdminProductDetailSerializer(product, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        product = self.get_object()
        
        serializer = UnblockProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product.is_blocked = False
        product.blocked_reason = ''
        product.save()
        
        ProductApprovalLog.objects.create(
            product=product,
            admin_user=request.user,
            action='unblocked',
            reason=serializer.validated_data.get('reason', '')
        )
        
        return Response({
            'message': 'Product unblocked successfully',
            'product': AdminProductDetailSerializer(product, context={'request': request}).data
        })

class DeliveryRequestViewSet(AdminLoginRequiredMixin, viewsets.ModelViewSet):
    """Manage delivery agent approval requests"""
    queryset = DeliveryAgentProfile.objects.filter(approval_status='pending')
    serializer_class = AdminDeliveryAgentDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        queryset = DeliveryAgentProfile.objects.filter(approval_status='pending')
        
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        serializer = AdminDeliveryAgentDetailSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        agent = self.get_object()
        
        if agent.approval_status != 'pending':
            return Response({'error': 'Only pending agents can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ApproveDeliveryAgentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agent.approval_status = 'approved'
        agent.approved_at = timezone.now()
        agent.save()
        
        DeliveryAgentApprovalLog.objects.create(
            agent=agent,
            admin_user=request.user,
            action='approved',
            reason=serializer.validated_data.get('reason', '')
        )
        
        # Send confirmation email
        try:
            user = agent.user
            print(f"DEBUG: Attempting to send agency approval email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Your Delivery Agent Account has been Approved!',
                message=f'Hello {user.username},\n\nGreat news! Your delivery agent account has been approved. You can now login to the delivery dashboard and start accepting delivery tasks.\n\nWelcome to the team!\nShopSphere',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending agency approval email: {str(e)}")
            pass
        
        return Response({
            'message': 'Delivery agent approved successfully',
            'agent': AdminDeliveryAgentDetailSerializer(agent, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        agent = self.get_object()
        
        if agent.approval_status != 'pending':
            return Response({'error': 'Only pending agents can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = RejectDeliveryAgentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agent.approval_status = 'rejected'
        agent.rejection_reason = serializer.validated_data['reason']
        agent.save()
        
        DeliveryAgentApprovalLog.objects.create(
            agent=agent,
            admin_user=request.user,
            action='rejected',
            reason=serializer.validated_data['reason']
        )
        
        # Send rejection email
        try:
            user = agent.user
            print(f"DEBUG: Attempting to send agent rejection email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Delivery Agent Application Update',
                message=f'Hello {user.username},\n\nWe regret to inform you that your delivery agent account application has been rejected.\n\nReason: {serializer.validated_data["reason"]}\n\nPlease contact support for more information.\n\nRegards,\nShopSphere Team',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending agent rejection email: {str(e)}")
            pass
        
        return Response({
            'message': 'Delivery agent rejected successfully',
            'agent': AdminDeliveryAgentDetailSerializer(agent, context={'request': request}).data
        })

class DeliveryAgentManagementViewSet(AdminLoginRequiredMixin, viewsets.ModelViewSet):
    queryset = DeliveryAgentProfile.objects.all()
    serializer_class = AdminDeliveryAgentListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        queryset = DeliveryAgentProfile.objects.all()
        
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(approval_status=status_filter)
        
        blocked_filter = request.query_params.get('blocked', None)
        if blocked_filter == 'true':
            queryset = queryset.filter(is_blocked=True)
        
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        serializer = AdminDeliveryAgentListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        agent = self.get_object()
        serializer = AdminDeliveryAgentDetailSerializer(agent, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        agent = self.get_object()
        serializer = BlockDeliveryAgentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agent.is_blocked = True
        agent.blocked_reason = serializer.validated_data['reason']
        agent.save()
        
        DeliveryAgentApprovalLog.objects.create(
            agent=agent,
            admin_user=request.user,
            action='blocked',
            reason=serializer.validated_data['reason']
        )
        
        # Send blocking email
        try:
            user = agent.user
            print(f"DEBUG: Attempting to send agent blocking email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Your Delivery Agent Account has been Blocked',
                message=f'Hello {user.username},\n\nYour delivery agent account has been blocked by the administrator.\n\nReason: {serializer.validated_data["reason"]}\n\nYou will not be able to accept delivery tasks while blocked. Please contact support for more details.\n\nRegards,\nShopSphere Team',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending agent blocking email: {str(e)}")
            pass
        
        return Response({
            'message': 'Agent blocked successfully',
            'agent': AdminDeliveryAgentDetailSerializer(agent, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        agent = self.get_object()
        agent.is_blocked = False
        agent.blocked_reason = ''
        agent.save()
        
        DeliveryAgentApprovalLog.objects.create(
            agent=agent,
            admin_user=request.user,
            action='unblocked'
        )
        
        # Send unblocking email
        try:
            user = agent.user
            print(f"DEBUG: Attempting to send agent unblocking email to {user.email}")
            res = send_mail(
                subject='[ShopSphere] Your Delivery Agent Account has been Unblocked',
                message=f'Hello {user.username},\n\nGood news! Your delivery agent account has been unblocked. You can now resume your delivery activities.\n\nWelcome back!\nShopSphere Team',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"DEBUG: send_mail result: {res}")
        except Exception as e:
            print(f"DEBUG: Error sending agent unblocking email: {str(e)}")
            pass
        
        return Response({
            'message': 'Agent unblocked successfully',
            'agent': AdminDeliveryAgentDetailSerializer(agent, context={'request': request}).data
        })

from django.utils import timezone


class DashboardView(AdminLoginRequiredMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        total_vendors = VendorProfile.objects.count()
        pending_vendors = VendorProfile.objects.filter(approval_status='pending').count()
        approved_vendors = VendorProfile.objects.filter(approval_status='approved').count()
        blocked_vendors = VendorProfile.objects.filter(is_blocked=True).count()
        inactive_vendors = VendorProfile.objects.filter(is_active=False).count()
        
        total_products = Product.objects.count()
        pending_products = Product.objects.filter(status='pending').count()
        approved_products = Product.objects.filter(status='approved').count()
        blocked_products = Product.objects.filter(is_blocked=True).count()
        
        total_agents = DeliveryAgentProfile.objects.count()
        pending_agents = DeliveryAgentProfile.objects.filter(approval_status='pending').count()
        approved_agents = DeliveryAgentProfile.objects.filter(approval_status='approved').count()
        blocked_agents = DeliveryAgentProfile.objects.filter(is_blocked=True).count()

        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        delivered_orders = Order.objects.filter(status='delivered').count()
        cancelled_orders = Order.objects.filter(status='cancelled').count()
        
        return Response({
            'vendors': {
                'total': total_vendors,
                'pending': pending_vendors,
                'approved': approved_vendors,
                'blocked': blocked_vendors,
                'inactive': inactive_vendors
            },
            'products': {
                'total': total_products,
                'pending': pending_products,
                'approved': approved_products,
                'blocked': blocked_products
            },
            'agents': {
                'total': total_agents,
                'pending': pending_agents,
                'approved': approved_agents,
                'blocked': blocked_agents
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'delivered': delivered_orders,
                'cancelled': cancelled_orders
            }
        })




from decimal import Decimal


class CommissionSettingsViewSet(AdminLoginRequiredMixin, viewsets.ModelViewSet):
    """
    Manage commission settings per category.
    """
    queryset = CommissionSetting.objects.all()
    serializer_class = CommissionSettingSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    def list(self, request, *args, **kwargs):
        # Initialize missing categories with defaults
        for cat_code, cat_name in CommissionSetting.CATEGORY_CHOICES:
            CommissionSetting.objects.get_or_create(
                category=cat_code,
                defaults={'percentage': 10.00, 'basic_fee': 0.00}
            )
            
        # Return only category-specific overrides for the list
        queryset = self.get_queryset().filter(category__isnull=False).order_by('category')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'post'], url_path='global')
    def global_commission(self, request):
        """Handle global settings (category=None)"""
        obj, created = CommissionSetting.objects.get_or_create(
            category=None,
            defaults={'percentage': 10.00, 'basic_fee': 0.00}
        )
        
        if request.method == 'POST':
            perc = request.data.get('percentage')
            basic = request.data.get('basic_fee')
            comm_type = request.data.get('commission_type')
            
            if perc is not None: obj.percentage = perc
            if basic is not None: obj.basic_fee = basic
            if comm_type: obj.commission_type = comm_type
            obj.save()
            return Response(CommissionSettingSerializer(obj).data)
            
        return Response(CommissionSettingSerializer(obj).data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Update multiple categories at once"""
        if not isinstance(request.data, list):
            return Response({'error': 'Expected a list of settings'}, status=status.HTTP_400_BAD_REQUEST)
            
        results = []
        for item in request.data:
            cat = item.get('category')
            perc = item.get('percentage')
            basic = item.get('basic_fee')
            comm_type = item.get('commission_type', 'percentage')
            
            if cat:
                obj, created = CommissionSetting.objects.get_or_create(category=cat)
                if perc is not None: obj.percentage = perc
                if basic is not None: obj.basic_fee = basic
                if comm_type is not None: obj.commission_type = comm_type
                obj.save()
                results.append(CommissionSettingSerializer(obj).data)
        
        return Response(results)


# ═══════════════════ REPORTS API ═══════════════════

from rest_framework.views import APIView

class ReportsView(APIView):
    """
    GET /superAdmin/api/reports/
    Returns live platform analytics for the React admin dashboard.
    Requires superuser / staff privileges.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from django.db.models import Count, Avg, Sum
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        from datetime import timedelta
        from user.models import Order, OrderItem
        from deliveryAgent.models import DeliveryCommission, DeliveryAssignment, DeliveryAgentProfile
        from finance.models import LedgerEntry

        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        seven_days_ago = today - timedelta(days=7)

        # ── Orders ───────────────────────────────
        order_qs = Order.objects.all()
        completed_qs = order_qs.filter(payment_status='completed')

        order_status_breakdown = list(
            order_qs.values('status').annotate(count=Count('id')).order_by('-count')
        )
        payment_status_breakdown = list(
            order_qs.values('payment_status').annotate(count=Count('id')).order_by('-count')
        )

        # ── Revenue ───────────────────────────────
        total_revenue = float(completed_qs.aggregate(t=Sum('total_amount'))['t'] or 0)
        avg_order_value = float(completed_qs.aggregate(a=Avg('total_amount'))['a'] or 0)
        revenue_today = float(completed_qs.filter(created_at__date=today).aggregate(t=Sum('total_amount'))['t'] or 0)
        revenue_week = float(completed_qs.filter(created_at__date__gte=seven_days_ago).aggregate(t=Sum('total_amount'))['t'] or 0)
        revenue_month = float(completed_qs.filter(created_at__date__gte=thirty_days_ago).aggregate(t=Sum('total_amount'))['t'] or 0)

        # ── Daily trend ───────────────────────────
        daily_revenue = list(
            completed_qs.filter(created_at__date__gte=thirty_days_ago)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('day')
        )
        for d in daily_revenue:
            d['day'] = d['day'].strftime('%d %b')
            d['revenue'] = float(d['revenue'])

        # ── Finance (LedgerEntry only has 'amount' field) ────────────────
        finance_total = float(LedgerEntry.objects.aggregate(t=Sum('amount'))['t'] or 0)
        finance_agg = {
            'total_gross': finance_total,
            'total_commission': 0,
            'total_net': finance_total,
        }

        # ── Top Vendors ───────────────────────────
        top_vendors = list(
            LedgerEntry.objects.filter(entry_type='credit')
            .values('vendor__shop_name')
            .annotate(
                total_gross=Sum('amount'),
                total_commission=Sum('amount'),
                total_net=Sum('amount'),
                order_count=Count('order', distinct=True)
            )
            .order_by('-total_net')[:10]
        )
        for v in top_vendors:
            for k in ['total_gross', 'total_commission', 'total_net']:
                v[k] = float(v[k] or 0)

        # ── Top Products ──────────────────────────
        top_products = list(
            OrderItem.objects.values('product_name')
            .annotate(
                total_qty=Sum('quantity'),
                total_revenue=Sum('subtotal'),
                order_count=Count('order', distinct=True),
            )
            .order_by('-total_qty')[:10]
        )
        for p in top_products:
            p['total_revenue'] = float(p['total_revenue'] or 0)

        # ── Delivery ──────────────────────────────
        total_commissions_paid = float(DeliveryCommission.objects.filter(status='paid').aggregate(t=Sum('total_commission'))['t'] or 0)
        total_commissions_pending = float(DeliveryCommission.objects.filter(status__in=['pending', 'approved']).aggregate(t=Sum('total_commission'))['t'] or 0)
        total_deliveries_done = DeliveryAssignment.objects.filter(status='delivered').count()
        total_deliveries_failed = DeliveryAssignment.objects.filter(status='failed').count()

        # ── Vendors & Products ────────────────────
        total_vendors = VendorProfile.objects.count()
        approved_vendors = VendorProfile.objects.filter(approval_status='approved').count()
        blocked_vendors = VendorProfile.objects.filter(is_blocked=True).count()
        inactive_vendors = VendorProfile.objects.filter(approval_status='pending').count()
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_blocked=False).count()
        blocked_products = Product.objects.filter(is_blocked=True).count()
        total_agents = DeliveryAgentProfile.objects.count()
        approved_agents = DeliveryAgentProfile.objects.filter(approval_status='approved').count()

        return Response({
            # Orders
            'total_orders': order_qs.count(),
            'orders_today': order_qs.filter(created_at__date=today).count(),
            'orders_this_week': order_qs.filter(created_at__date__gte=seven_days_ago).count(),
            'orders_this_month': order_qs.filter(created_at__date__gte=thirty_days_ago).count(),
            'order_status_breakdown': order_status_breakdown,
            'payment_status_breakdown': payment_status_breakdown,

            # Revenue
            'total_revenue': total_revenue,
            'avg_order_value': avg_order_value,
            'revenue_today': revenue_today,
            'revenue_week': revenue_week,
            'revenue_month': revenue_month,
            'daily_revenue': daily_revenue,

            # Finance
            'total_gross': float(finance_agg['total_gross'] or 0),
            'total_platform_commission': float(finance_agg['total_commission'] or 0),
            'total_net': float(finance_agg['total_net'] or 0),

            # Vendors & Products
            'total_vendors': total_vendors,
            'approved_vendors': approved_vendors,
            'blocked_vendors': blocked_vendors,
            'inactive_vendors': inactive_vendors,
            'total_products': total_products,
            'active_products': active_products,
            'blocked_products': blocked_products,
            'top_vendors': top_vendors,

            # Products
            'top_products': top_products,

            # Delivery
            'total_delivery_commissions_paid': total_commissions_paid,
            'total_delivery_commissions_pending': total_commissions_pending,
            'total_deliveries_done': total_deliveries_done,
            'total_deliveries_failed': total_deliveries_failed,
            'total_agents': total_agents,
            'approved_agents': approved_agents,

            # Meta
            'report_date': str(today),
        })


class UserManagementView(APIView):
    """
    GET /superAdmin/api/users/  — Customers only, with live risk scores.
    Risk score 0-100 derived from:
      - Cancellation rate  → up to 40 pts
      - Return rate        → up to 30 pts
      - Failed payments    → up to 30 pts
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from django.db.models import Count, Q
        from user.models import Order, OrderReturn
        User = get_user_model()

        # Customers only
        qs = User.objects.filter(
            is_superuser=False, is_staff=False, role='customer'
        ).order_by('-date_joined')

        # Optional search
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search) | Q(username__icontains=search)
            )

        # Optional status filter
        status_filter = request.query_params.get('status', '').strip().upper()
        if status_filter == 'BLOCKED':
            qs = qs.filter(is_blocked=True)
        elif status_filter == 'ACTIVE':
            qs = qs.filter(is_blocked=False)

        # Aggregate stats bases on full customer set (before search/status filters)
        base_customers = User.objects.filter(
            is_superuser=False, is_staff=False, role='customer'
        )
        total = base_customers.count()
        active_count = base_customers.filter(is_blocked=False).count()
        blocked_count = base_customers.filter(is_blocked=True).count()

        # Pre-fetch order stats per user for efficient risk scoring
        order_stats = {
            row['user_id']: row
            for row in Order.objects.values('user_id').annotate(
                total=Count('id'),
                cancelled=Count('id', filter=Q(status='cancelled')),
                failed_payments=Count('id', filter=Q(payment_status='failed')),
            )
        }
        # Pre-fetch return counts per user
        return_counts = {
            row['user_id']: row['returns']
            for row in OrderReturn.objects.values('user_id').annotate(returns=Count('id'))
        }

        users = []
        for u in qs:
            stats = order_stats.get(u.id, {})
            total_orders = stats.get('total', 0)
            cancelled = stats.get('cancelled', 0)
            failed_pay = stats.get('failed_payments', 0)
            returns = return_counts.get(u.id, 0)

            # ── Risk score ────────────────────────────────────────────────
            # 1. Cancellation rate → 0-40 pts
            cancel_rate = (cancelled / total_orders) if total_orders else 0
            cancel_score = round(cancel_rate * 40)

            # 2. Return rate → 0-30 pts
            return_rate = (returns / total_orders) if total_orders else 0
            return_score = round(return_rate * 30)

            # 3. Failed payments → 0-30 pts (10 pts each, capped at 30)
            payment_score = min(failed_pay * 10, 30)

            risk_score = min(cancel_score + return_score + payment_score, 100)
            # ─────────────────────────────────────────────────────────────

            users.append({
                'id': u.id,
                'name': u.username or u.email.split('@')[0],
                'email': u.email,
                'role': u.role,
                'status': 'BLOCKED' if u.is_blocked else 'ACTIVE',
                'blocked_reason': u.blocked_reason or '',
                'joinDate': u.date_joined.strftime('%Y-%m-%d'),
                'is_active': u.is_active,
                # Order activity
                'total_orders': total_orders,
                'cancelled_orders': cancelled,
                'return_requests': returns,
                'failed_payments': failed_pay,
                # Risk
                'riskScore': risk_score,
            })

        return Response({
            'users': users,
            'total': total,
            'active': active_count,
            'blocked': blocked_count,
        })


class UserBlockToggleView(APIView):
    """
    POST /superAdmin/api/users/{id}/toggle-block/
    Body: { "action": "BLOCK"|"UNBLOCK", "reason": "optional" }
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        User = get_user_model()
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_superuser or user.is_staff:
            return Response({'error': 'Cannot modify admin accounts'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action', '').upper()
        reason = request.data.get('reason', '')

        if action == 'BLOCK':
            user.is_blocked = True
            user.blocked_reason = reason or 'Blocked by superadmin'
            user.save()
            return Response({
                'message': f'{user.email} has been blocked.',
                'status': 'BLOCKED',
            })
        elif action == 'UNBLOCK':
            user.is_blocked = False
            user.blocked_reason = ''
            user.save()
            return Response({
                'message': f'{user.email} access has been restored.',
                'status': 'ACTIVE',
            })
        else:
            return Response({'error': 'Invalid action. Use BLOCK or UNBLOCK.'}, status=status.HTTP_400_BAD_REQUEST)


# ===============================================
#     ADMIN: Trigger Auto-Assignment for an Order
# ===============================================

class TriggerAssignmentView(APIView):
    """
    POST /superAdmin/api/trigger-assignment/{order_id}/
    Manually trigger auto-assignment for a specific order.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, order_id):
        from user.models import Order
        from deliveryAgent.services import auto_assign_order

        try:
            order = Order.objects.select_related('delivery_address').get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        assignment = auto_assign_order(order)

        if assignment:
            return Response({
                'message': f'Order #{order_id} assigned to {assignment.agent.user.username}',
                'assignment_id': assignment.id,
                'agent': assignment.agent.user.username,
                'delivery_city': assignment.delivery_city,
                'estimated_date': str(assignment.estimated_delivery_date),
                'delivery_fee': str(assignment.delivery_fee),
            })
        else:
            return Response({
                'message': 'No available agents found for this order.',
                'order_id': order_id,
                'delivery_city': getattr(order.delivery_address, 'city', 'Unknown'),
            }, status=status.HTTP_200_OK)


class UnassignedOrdersView(APIView):
    """
    GET /superAdmin/api/unassigned-orders/
    Lists all paid orders that have no DeliveryAssignment yet,
    so admin can manually trigger assignment.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from deliveryAgent.services import get_unassigned_confirmed_orders

        qs = get_unassigned_confirmed_orders()
        orders = []
        for o in qs:
            addr = o.delivery_address
            orders.append({
                'id': o.id,
                'order_number': o.order_number,
                'status': o.status,
                'payment_status': o.payment_status,
                'total_amount': float(o.total_amount),
                'created_at': o.created_at.strftime('%Y-%m-%d %H:%M'),
                'delivery_city': addr.city if addr else '—',
                'delivery_state': addr.state if addr else '—',
                'customer': o.user.email,
            })
        return Response({'orders': orders, 'count': len(orders)})


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only viewset to manage all orders.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Order.objects.all().select_related('user', 'delivery_address')
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return AdminOrderListSerializer
        return AdminOrderDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(user__email__icontains=search)
            )
        return queryset


class AdminOrderTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only viewset to monitor all delivery assignments and their tracking history.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    queryset = DeliveryAssignment.objects.all().select_related('agent', 'agent__user', 'order', 'order__user')
    serializer_class = DeliveryAssignmentDetailSerializer
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return DeliveryAssignmentListSerializer
        return self.serializer_class

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class SettlePaymentView(APIView):
    """
    POST /superAdmin/api/settle-payment/{order_item_id}/
    Admin clicks a button to settle the payment for a specific order item.
    Moves net_amount from Admin Wallet to Vendor Wallet.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, order_item_id):
        from user.models import OrderItem, AuthUser, UserWallet
        from django.utils import timezone
        from django.db import transaction as db_transaction
        
        try:
            item = OrderItem.objects.select_related('order', 'vendor__user').get(id=order_item_id)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Order item not found'}, status=404)

        if item.is_settled:
            return Response({'error': 'This item is already settled.'}, status=400)
        
        if item.order.status != 'delivered':
            return Response({'error': 'Order must be delivered before settlement.'}, status=400)

        # Calculate Net Amount (Commission is already stored on item)
        net_amount = item.subtotal - item.commission_amount

        try:
            with db_transaction.atomic():
                # 1. Get Admin Wallet (First superuser)
                admin_user = AuthUser.objects.filter(is_superuser=True).first()
                if not admin_user:
                    return Response({'error': 'No admin user found to deduct from.'}, status=500)
                
                admin_wallet, _ = UserWallet.objects.get_or_create(user=admin_user)
                
                if not item.vendor or not item.vendor.user:
                    return Response({'error': 'Vendor details missing for this item.'}, status=400)
                    
                vendor_wallet, _ = UserWallet.objects.get_or_create(user=item.vendor.user)

                # 2. Check Admin Balance
                if admin_wallet.balance < net_amount:
                    # For platform wallets, maybe we auto-topup or allow negative.
                    pass

                # 3. Deduct from Admin
                admin_wallet.deduct_balance(
                    net_amount, 
                    description=f"Settlement for Order Item #{item.id} (Order: {item.order.order_number})"
                )

                # 4. Credit to Vendor
                vendor_wallet.add_balance(
                    net_amount,
                    description=f"Received payment for Order Item #{item.id} (Order: {item.order.order_number})"
                )

                # 5. Mark as Settled
                item.is_settled = True
                item.settled_at = timezone.now()
                item.save(update_fields=['is_settled', 'settled_at'])

                # 6. Log activity in LedgerEntry
                from finance.models import LedgerEntry
                LedgerEntry.objects.create(
                    vendor=item.vendor,
                    order=item.order,
                    amount=net_amount,
                    entry_type='credit',
                    description=f"Settled payment for item: {item.product_name}"
                )

                return Response({
                    'message': 'Payment settled successfully.',
                    'net_amount': float(net_amount),
                    'vendor': item.vendor.shop_name
                })

        except Exception as e:
            return Response({'error': str(e)}, status=500)
