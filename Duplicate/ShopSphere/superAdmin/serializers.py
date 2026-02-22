from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from vendor.models import VendorProfile, Product, ProductImage
from .models import VendorApprovalLog, ProductApprovalLog, DeliveryAgentApprovalLog
from deliveryAgent.models import DeliveryAgentProfile
from user.models import Order, OrderItem, Address
from user.serializers import OrderItemSerializer, AddressSerializer
from deliveryAgent.serializers import SimpleDeliveryAgentSerializer

class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source='user.email', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_email', 'total_amount', 
            'status', 'payment_status', 'created_at'
        ]

class AdminOrderDetailSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source='user.email', read_only=True)
    customer_name = serializers.CharField(source='user.get_full_name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_address = AddressSerializer(read_only=True)
    delivery_agent = SimpleDeliveryAgentSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_email', 'customer_name',
            'payment_method', 'payment_status', 'transaction_id',
            'subtotal', 'tax_amount', 'shipping_cost', 'total_amount', 
            'status', 'delivery_address', 'delivery_agent', 'created_at', 
            'items'
        ]


class VendorApprovalLogSerializer(serializers.ModelSerializer):
    admin_user_name = serializers.CharField(source='admin_user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = VendorApprovalLog
        fields = [
            'id', 'vendor', 'admin_user', 'admin_user_name', 'action',
            'action_display', 'reason', 'timestamp'
        ]
        read_only_fields = ['id', 'admin_user', 'timestamp']

class ProductApprovalLogSerializer(serializers.ModelSerializer):
    admin_user_name = serializers.CharField(source='admin_user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ProductApprovalLog
        fields = [
            'id', 'product', 'admin_user', 'admin_user_name', 'action',
            'action_display', 'reason', 'timestamp'
        ]
        read_only_fields = ['id', 'admin_user', 'timestamp']

from django.urls import reverse

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'uploaded_at']

    def get_url(self, obj):
        request = self.context.get('request')
        path = reverse('serve_product_image', kwargs={'image_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

class AdminVendorDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    approval_logs = VendorApprovalLogSerializer(source='approval_logs.all', many=True, read_only=True)
    
    id_proof_file = serializers.SerializerMethodField()
    pan_card_file = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorProfile
        fields = [
            'id', 'user_username', 'user_email', 'user_phone', 'shop_name', 'shop_description',
            'address', 'business_type', 'id_type', 'id_number', 'id_proof_file',
            'gst_number', 'pan_number', 'pan_name', 'pan_card_file',
            'bank_holder_name', 'bank_account_number', 'bank_ifsc_code', 'shipping_fee',
            'approval_status', 'approval_status_display', 'rejection_reason',
            'is_blocked', 'blocked_reason', 'created_at', 'approval_logs'
        ]

    def get_id_proof_file(self, obj):
        request = self.context.get('request')
        if not obj.id_proof_data: return None
        path = reverse('serve_vendor_id_proof', kwargs={'vendor_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_pan_card_file(self, obj):
        request = self.context.get('request')
        if not obj.pan_card_data: return None
        path = reverse('serve_vendor_pan_card', kwargs={'vendor_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

class AdminProductDetailSerializer(serializers.ModelSerializer):
    vendor_shop_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_owner = serializers.CharField(source='vendor.user.username', read_only=True)
    approval_logs = ProductApprovalLogSerializer(source='approval_logs.all', many=True, read_only=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'vendor_shop_name', 'vendor_owner', 'name',
            'description', 'price', 'quantity', 'image', 'status',
            'is_blocked', 'blocked_reason', 'created_at', 'approval_logs'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        first_image = obj.images.first()
        if first_image:
            path = reverse('serve_product_image', kwargs={'image_id': first_image.id})
            if request:
                return request.build_absolute_uri(path)
            return path
        return None

class AdminVendorListSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = [
            'id', 'shop_name', 'user_email', 'approval_status',
            'approval_status_display', 'is_blocked', 'created_at'
        ]

class AdminProductListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'vendor', 'vendor_name', 
            'price', 'quantity', 'status', 'images', 'is_blocked', 'created_at'
        ]

class ApproveVendorSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)

class RejectVendorSerializer(serializers.Serializer):
    reason = serializers.CharField()

class BlockVendorSerializer(serializers.Serializer):
    reason = serializers.CharField()

class UnblockVendorSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)

class BlockProductSerializer(serializers.Serializer):
    reason = serializers.CharField()

class UnblockProductSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
class DeliveryAgentApprovalLogSerializer(serializers.ModelSerializer):
    admin_user_name = serializers.CharField(source='admin_user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = DeliveryAgentApprovalLog
        fields = [
            'id', 'agent', 'admin_user', 'admin_user_name', 'action',
            'action_display', 'reason', 'timestamp'
        ]
        read_only_fields = ['id', 'admin_user', 'timestamp']

class AdminDeliveryAgentDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    approval_logs = DeliveryAgentApprovalLogSerializer(source='approval_logs.all', many=True, read_only=True)
    
    id_proof_file = serializers.SerializerMethodField()
    license_file = serializers.SerializerMethodField()
    vehicle_registration = serializers.SerializerMethodField()
    vehicle_insurance = serializers.SerializerMethodField()

    date_of_birth = serializers.DateField(read_only=True)
    license_expires = serializers.DateField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = DeliveryAgentProfile
        fields = [
            'id', 'user_username', 'user_email', 'phone_number', 'date_of_birth',
            'address', 'city', 'state', 'postal_code', 'vehicle_type',
            'vehicle_number', 'vehicle_registration', 'vehicle_insurance',
            'license_number', 'license_file', 'license_expires',
            'id_type', 'id_number', 'id_proof_file',
            'bank_holder_name', 'bank_account_number', 'bank_ifsc_code', 'bank_name',
            'service_cities', 'service_pincodes',
            'approval_status', 'approval_status_display', 'rejection_reason',
            'is_blocked', 'blocked_reason', 'created_at', 'approval_logs'
        ]

    def get_id_proof_file(self, obj):
        request = self.context.get('request')
        if not obj.id_proof_data: return None
        path = reverse('serve_agent_id_proof', kwargs={'agent_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_license_file(self, obj):
        request = self.context.get('request')
        if not obj.license_file_data: return None
        path = reverse('serve_agent_license', kwargs={'agent_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_vehicle_registration(self, obj):
        request = self.context.get('request')
        if not obj.vehicle_registration_data: return None
        path = reverse('serve_agent_vehicle_registration', kwargs={'agent_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_vehicle_insurance(self, obj):
        request = self.context.get('request')
        if not obj.vehicle_insurance_data: return None
        path = reverse('serve_agent_vehicle_insurance', kwargs={'agent_id': obj.id})
        if request:
            return request.build_absolute_uri(path)
        return path

class AdminDeliveryAgentListSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = DeliveryAgentProfile
        fields = [
            'id', 'user_email', 'phone_number', 'vehicle_type',
            'approval_status', 'approval_status_display', 'is_blocked', 'created_at'
        ]

class ApproveDeliveryAgentSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)

class RejectDeliveryAgentSerializer(serializers.Serializer):
    reason = serializers.CharField()

class BlockDeliveryAgentSerializer(serializers.Serializer):
    reason = serializers.CharField()

class UnblockDeliveryAgentSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


from .models import CommissionSetting

class CommissionSettingSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = CommissionSetting
        fields = [
            'id', 'category', 'category_display', 'percentage', 
            'basic_fee', 'commission_type', 'is_active', 'updated_at'
        ]
