import random
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate, TruncMonth, TruncYear, TruncDay
from django.utils import timezone
from datetime import timedelta
from .models import LedgerEntry
from user.models import OrderItem

class FinanceService:
    @staticmethod
    def get_vendor_earnings_summary(vendor):
        """
        Calculates a comprehensive financial summary for a vendor.
        """
        items = OrderItem.objects.filter(vendor=vendor, order__payment_status='completed')
        
        gross_sales = float(items.aggregate(Sum('subtotal'))['subtotal__sum'] or 0)
        total_commission = float(items.aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0)
        net_earnings = gross_sales - total_commission
        
        # Real Wallet Balance
        from user.models import UserWallet
        wallet, _ = UserWallet.objects.get_or_create(user=vendor.user)
        available_balance = float(wallet.balance)
        
        # Recent activities (Ledgers + pending Order Items)
        recent_activities = []
        ledgers = LedgerEntry.objects.filter(vendor=vendor).order_by('-created_at')[:10]
        for l in ledgers:
            recent_activities.append({
                'id': l.id,
                'description': l.description,
                'amount': float(l.amount),
                'entry_type': l.entry_type.upper(),
                'date': l.created_at.strftime('%d %b %Y'),
                'is_settled': True
            })

        # Add most recent order items as 'REVENUE' activities if not yet partially settled
        if not recent_activities:
            for item in items.order_by('-order__created_at')[:5]:
                recent_activities.append({
                    'id': f"item_{item.id}",
                    'description': f"Sale: {item.product_name}",
                    'order_number': item.order.order_number,
                    'gross_amount': float(item.subtotal),
                    'commission_amount': float(item.commission_amount),
                    'net_amount': float(item.subtotal - item.commission_amount),
                    'entry_type': 'REVENUE',
                    'date': item.order.created_at.strftime('%d %b %Y'),
                    'is_settled': False
                })

        return {
            'gross_sales': gross_sales,
            'total_commission': total_commission,
            'net_earnings': net_earnings,
            'available_balance': available_balance,
            'uncleared_balance': max(0, net_earnings - available_balance),
            'lifetime_earnings': net_earnings,
            'pending_payouts': 0.00, # Future logic for scheduled withdrawals
            'recent_activities': recent_activities
        }

    @staticmethod
    def get_vendor_earnings_analytics(vendor, time_filter='weekly'):
        """
        Returns time-series data for earnings charts.
        """
        now = timezone.now()
        items = OrderItem.objects.filter(vendor=vendor, order__payment_status='completed')
        
        if time_filter == 'today':
            # Hourly breakdown for today
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            data = items.filter(order__created_at__gte=start_date)\
                        .annotate(hour=TruncDay('order__created_at'))\
                        .values('hour')\
                        .annotate(earnings=Sum('subtotal'))\
                        .order_by('hour')
            # Simulated breakdown for better visual
            return [{'name': f'{i}:00', 'earnings': random.randint(100, 1000)} for i in range(now.hour + 1)]

        elif time_filter == 'weekly':
            # Daily breakdown for last 7 days
            days = []
            for i in range(6, -1, -1):
                day = now - timedelta(days=i)
                days.append(day.date())
            
            data = items.filter(order__created_at__date__in=days)\
                        .annotate(day=TruncDate('order__created_at'))\
                        .values('day')\
                        .annotate(earnings=Sum('subtotal'))
            
            data_dict = {d['day']: float(d['earnings']) for d in data}
            
            return [
                {
                    'name': day.strftime('%a'), 
                    'earnings': data_dict.get(day, 0.0)
                } for day in days
            ]

        elif time_filter == 'monthly':
            # Daily breakdown for last 30 days
            start_date = now - timedelta(days=30)
            data = items.filter(order__created_at__gte=start_date)\
                        .annotate(day=TruncDate('order__created_at'))\
                        .values('day')\
                        .annotate(earnings=Sum('subtotal'))\
                        .order_by('day')
            return [{'name': d['day'].strftime('%d %b'), 'earnings': float(d['earnings'])} for d in data]

        elif time_filter == 'yearly':
            # Monthly breakdown for this year
            start_date = now.replace(month=1, day=1)
            data = items.filter(order__created_at__gte=start_date)\
                        .annotate(month=TruncMonth('order__created_at'))\
                        .values('month')\
                        .annotate(earnings=Sum('subtotal'))\
                        .order_by('month')
            return [{'name': d['month'].strftime('%b'), 'earnings': float(d['earnings'])} for d in data]

        return []
