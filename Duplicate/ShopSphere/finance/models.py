from django.db import models

class LedgerEntry(models.Model):
    TRANSACTION_TYPES = (
        ('credit', 'Credit (Earnings)'),
        ('debit', 'Debit (Deduction/Withdrawal)'),
    )
    
    vendor = models.ForeignKey('vendor.VendorProfile', on_delete=models.CASCADE, related_name='ledgers')
    order = models.ForeignKey('user.Order', on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    entry_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Ledger Entries"

    def __str__(self):
        return f"{self.vendor.shop_name} - {self.entry_type} - {self.amount}"
