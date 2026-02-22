from django.db import models
from django.conf import settings
from django.utils import timezone
from vendor.models import VendorProfile, Product

class VendorApprovalLog(models.Model):
    
    ACTION_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('blocked', 'Blocked'),
        ('unblocked', 'Unblocked'),
        ('reviewed', 'Reviewed'),
    ]

    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='approval_logs')
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='vendor_approvals')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.vendor.shop_name} - {self.action} by {self.admin_user.username if self.admin_user else 'System'}"

class ProductApprovalLog(models.Model):
    
    ACTION_CHOICES = [
        ('blocked', 'Blocked'),
        ('unblocked', 'Unblocked'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='approval_logs')
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='product_approvals')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.product.name} - {self.action} by {self.admin_user.username if self.admin_user else 'System'}"
class DeliveryAgentApprovalLog(models.Model):
    ACTION_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('blocked', 'Blocked'),
        ('unblocked', 'Unblocked'),
    ]

    agent = models.ForeignKey('deliveryAgent.DeliveryAgentProfile', on_delete=models.CASCADE, related_name='approval_logs')
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='agent_approvals')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.agent.user.email} - {self.action} by {self.admin_user.username if self.admin_user else 'System'}"


class CommissionSetting(models.Model):
    """
    Model to store commission percentages.
    Can be global (category=None) or specific to a category.
    """
    COMMISSION_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed'),
    ]

    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('fashion', 'Fashion'),
        ('home_kitchen', 'Home & Kitchen'),
        ('beauty_personal_care', 'Beauty & Personal Care'),
        ('sports_fitness', 'Sports & Fitness'),
        ('toys_games', 'Toys & Games'),
        ('automotive', 'Automotive'),
        ('grocery', 'Grocery'),
        ('books', 'Books'),
        ('services', 'Services'),
        ('other', 'Other'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    basic_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    commission_type = models.CharField(max_length=20, choices=COMMISSION_TYPES, default='percentage')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.category:
            return f"{self.get_category_display()} - {self.percentage}%"
        return f"Global - {self.percentage}%"

    class Meta:
        ordering = ['category']

    @staticmethod
    def get_commission_for_product(product):
        """
        Determine the commission rate for a specific product.
        Priority: Category-specific override > Global setting.
        """
        # 1. Check for category-specific override
        setting = CommissionSetting.objects.filter(category=product.category, is_active=True).first()
        
        # 2. Fallback to global setting if no override found
        if not setting:
            setting = CommissionSetting.objects.filter(category=None, is_active=True).first()
            
        if setting:
            return {
                'rate': setting.percentage,
                'type': setting.commission_type,
                'basic_fee': setting.basic_fee
            }
            
        # 3. Final default (10%) if no rows exist at all
        return {
            'rate': 10.00,
            'type': 'percentage',
            'basic_fee': 0.00
        }
