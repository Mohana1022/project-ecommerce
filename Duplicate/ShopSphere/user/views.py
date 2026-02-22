from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from decimal import Decimal

from .models import AuthUser, Cart, CartItem, Order, OrderItem, Address, Review, Payment, UserWallet, WalletTransaction
from .serializers import RegisterSerializer, ProductSerializer, CartSerializer, OrderSerializer, AddressSerializer, ReviewSerializer
from .forms import AddressForm
import uuid
from django.db import transaction
from vendor.models import Product
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, F, FloatField, ExpressionWrapper, Q
from django.views.decorators.csrf import csrf_exempt


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet_balance(request):
    """Get current user's wallet balance and transactions"""
    wallet, _ = UserWallet.objects.get_or_create(user=request.user)
    transactions = WalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')[:20]
    
    return Response({
        'balance': float(wallet.balance),
        'total_credited': float(wallet.total_credited),
        'total_debited': float(wallet.total_debited),
        'transactions': [{
            'id': t.id,
            'type': t.transaction_type,
            'amount': float(t.amount),
            'description': t.description,
            'date': t.created_at.strftime('%Y-%m-%d %H:%M')
        } for t in transactions]
    })


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def register_api(request):
    if request.method == 'GET':
        return render(request, "user_register.html")
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        if request.accepted_renderer.format == 'json':
            return Response({"message": "User registered successfully"}, status=201)
        return redirect('user_login')

    if request.accepted_renderer.format == 'json':
        return Response(serializer.errors, status=400)
    return render(request, "user_register.html", {"error": serializer.errors})

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def login_api(request):
    if request.method == 'GET':
        return render(request, "user_login.html")
    
    # support both JSON API clients (username/email) and HTML form
    username_or_email = request.data.get('email') or request.data.get('username')
    password = request.data.get('password')

    auth_identifier = username_or_email
    # If user provided a username instead of an email, resolve to the underlying email
    # because USERNAME_FIELD is 'email' in our AuthUser model.
    if username_or_email and '@' not in username_or_email:
        try:
            u = AuthUser.objects.get(username=username_or_email)
            auth_identifier = u.email
        except AuthUser.DoesNotExist:
            auth_identifier = None

    # Try to authenticate. Since USERNAME_FIELD is 'email', we pass the identifier as 'username'
    user = authenticate(request, username=auth_identifier, password=password)

    if user:
        # Basic active check
        if not user.is_active:
            return Response({"error": "This account is inactive."}, status=403)
        
        # Check global blocked status
        if user.is_blocked:
            return Response({"error": f"Account blocked: {user.blocked_reason or 'No reason provided'}"}, status=403)

        # Role-specific approval and status checks
        if user.role == 'delivery':
            try:
                # Late import to prevent circularity if models reference each other
                from deliveryAgent.models import DeliveryAgentProfile
                profile = user.delivery_agent_profile
                if profile.approval_status != 'approved':
                    return Response({
                        "error": "Your delivery partner registration is still pending admin approval. Please check back later.",
                        "status": "pending_approval"
                    }, status=403)
                if profile.is_blocked:
                    return Response({
                        "error": f"Your delivery account has been restricted. Reason: {profile.blocked_reason or 'Policy violation'}",
                        "status": "blocked"
                    }, status=403)
            except Exception:
                # If profile doesn't exist but role is delivery, it's an inconsistent state
                pass

        elif user.role == 'vendor':
            try:
                from vendor.models import VendorProfile
                profile = user.vendor_profile
                if profile.approval_status != 'approved':
                    return Response({
                        "error": "Your vendor account is pending admin approval. You will be notified once approved.",
                        "status": "pending_approval"
                    }, status=403)
                if profile.is_blocked:
                    return Response({
                        "error": f"Your vendor account is currently blocked. Reason: {profile.blocked_reason or 'Policy violation'}",
                        "status": "blocked"
                    }, status=403)
            except Exception:
                pass

        login(request, user)
        
        # Determine effective role for backward compatibility
        effective_role = user.role
        all_user_roles = user.all_roles
        
        # If user has a delivery/vendor profile, ensure that's reflected even if current role is 'customer'
        if 'delivery' in all_user_roles and effective_role == 'customer':
            effective_role = 'delivery'
        elif 'vendor' in all_user_roles and effective_role == 'customer':
            effective_role = 'vendor'

        refresh = RefreshToken.for_user(user)
        # Add custom claims
        refresh['role'] = effective_role
        refresh['all_roles'] = all_user_roles
        refresh['username'] = user.username
        refresh['is_staff'] = user.is_staff
        refresh['is_superuser'] = user.is_superuser
        
        if request.accepted_renderer.format == 'json':
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "role": effective_role,
                "all_roles": all_user_roles,
                "email": user.email
            })
        else:
            return redirect('user_products')

    return Response({"error": "Invalid email or password. Please try again."}, status=401)
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_api(request):
    email = request.data.get('email')
    username = request.data.get('name')
    
    if not email:
        return Response({"error": "Email is required from Google"}, status=400)
    
    # Try to find the user by email
    try:
        user = AuthUser.objects.get(email=email)
    except AuthUser.DoesNotExist:
        # Create a new user if not found
        # Use name from Google as username, or part of email
        base_username = username if username else email.split('@')[0]
        final_username = base_username
        
        # Ensure username uniqueness (basic implementation)
        counter = 1
        while AuthUser.objects.filter(username=final_username).exists():
            final_username = f"{base_username}{counter}"
            counter += 1
            
        user = AuthUser.objects.create(
            email=email,
            username=final_username,
            role='customer' # Default role for Google login
        )
        user.set_unusable_password()
        user.save()

    # Basic active check
    if not user.is_active:
        return Response({"error": "This account is inactive."}, status=403)
    
    # Check global blocked status
    if user.is_blocked:
        return Response({"error": f"Account blocked: {user.blocked_reason or 'No reason provided'}"}, status=403)

    login(request, user)
    refresh = RefreshToken.for_user(user)
    # Add custom claims
    refresh['role'] = user.role
    refresh['username'] = user.username
    
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "username": user.username,
        "role": user.role,
        "email": user.email
    })


# 🔹 HOME (Product Page)
@api_view(['GET'])


#permission_classes([IsAuthenticated])

def home_api(request):
    products = Product.objects.filter(status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False)
    
    if request.accepted_renderer.format == 'json':
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    cart_count = 0
    if request.user.is_authenticated:
        try:
            cart = Cart.objects.get(user=request.user)
            cart_count = sum(item.quantity for item in cart.items.all())
        except Cart.DoesNotExist:
            pass
            
    return render(request, "product_list.html", {
        "products": products, 
        "cart_count": cart_count,
        "user": request.user
    })

def get_product(request):
    products = Product.objects.filter(status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False)
    cart_count = 0
    if request.user.is_authenticated:
        try:
            cart = Cart.objects.get(user=request.user)
            cart_count = sum(item.quantity for item in cart.items.all())
        except Cart.DoesNotExist:
            pass
            
    return render(request, "product_list.html", {
        "products": products, 
        "cart_count": cart_count,
        "user": request.user
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id, status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False)
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
    
    if not item_created:
        cart_item.quantity += 1
        cart_item.save()
    
    if request.accepted_renderer.format == 'json':
        return Response({
            "message": "Product added to cart",
            "cart_count": sum(item.quantity for item in cart.items.all())
        })
        
    return redirect('cart')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_items = cart.items.all()
    
    if request.accepted_renderer.format == 'json':
        serializer = CartSerializer(cart)
        return Response(serializer.data)
        
    total_price = sum(item.get_total() for item in cart_items)
    
    return render(request, "cart.html", {
        "cart_items": cart_items, 
        "total_cart_price": total_price
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkout_view(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_items = cart.items.all()
    
    if not cart_items:
        if request.accepted_renderer.format == 'json':
             return Response({"message": "Cart is empty"}, status=400)
        return redirect('cart')
        
    total_price = sum(item.get_total() for item in cart_items)
    items_count = sum(item.quantity for item in cart_items)
    
    if request.accepted_renderer.format == 'json':
        return Response({
            "total_price": total_price,
            "items_count": items_count,
            "cart_items": CartSerializer(cart).data
        })
    
    return render(request, "checkout.html", {
        "total_price": total_price,
        "items_count": items_count
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    payment_mode = request.data.get('payment_mode')
    transaction_id = request.data.get('transaction_id') or str(uuid.uuid4())[:12]
    items_from_request = request.data.get('items')
    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"

    if not payment_mode:
        return Response({"error": "Payment mode required"}, status=400)

    try:
        with transaction.atomic():
            # CASE 1: Items passed directly (frontend state)
            if items_from_request:
                total_amount = Decimal('0.00')
                for item_data in items_from_request:
                    price = Decimal(str(item_data.get('price', 0)))
                    quantity = int(item_data.get('quantity', 1))
                    total_amount += price * quantity
                
                order = Order.objects.create(
                    user=request.user,
                    order_number=order_number,
                    payment_method=payment_mode,
                    transaction_id=transaction_id,
                    total_amount=total_amount,
                    subtotal=total_amount,
                    payment_status='completed'
                )
                
                # Create Payment record
                Payment.objects.create(
                    order=order,
                    user=request.user,
                    method=payment_mode if payment_mode in dict(Payment.PAYMENT_METHOD_CHOICES) else 'cod',
                    amount=total_amount,
                    transaction_id=transaction_id,
                    status='completed',
                    completed_at=timezone.now().replace(second=0, microsecond=0)
                )
                
                from superAdmin.models import CommissionSetting
                for item_data in items_from_request:
                    price = Decimal(str(item_data.get('price', 0)))
                    quantity = int(item_data.get('quantity', 1))
                    
                    # Try to find the product object to maintain the FK relation
                    product_obj = Product.objects.filter(name=item_data.get('name')).first()
                    
                    # --- STOCK REDUCTION LOGIC ---
                    if product_obj:
                        if product_obj.quantity < quantity:
                            raise Exception(f"Insufficient stock for {product_obj.name}. Available: {product_obj.quantity}")
                        product_obj.quantity -= quantity
                        product_obj.save(update_fields=['quantity'])
                    # -----------------------------

                    commission_rate = Decimal('10.00')
                    commission_amount = Decimal('0.00')
                    
                    if product_obj:
                        comm_data = CommissionSetting.get_commission_for_product(product_obj)
                        commission_rate = Decimal(str(comm_data['rate']))
                        basic_fee = Decimal(str(comm_data.get('basic_fee', 0)))
                        if comm_data['type'] == 'percentage':
                            commission_amount = ((price * quantity * commission_rate) / 100) + basic_fee
                        else:
                            commission_amount = commission_rate + basic_fee # Fixed amount + basic fee
                    
                    OrderItem.objects.create(
                        order=order,
                        product=product_obj,
                        vendor=product_obj.vendor if product_obj else None,
                        product_name=item_data.get('name'),
                        quantity=quantity,
                        product_price=price,
                        subtotal=price * quantity,
                        commission_rate=commission_rate,
                        commission_amount=commission_amount
                    )
                Cart.objects.filter(user=request.user).delete()

            # CASE 2: Use items from the database cart
            else:
                cart = Cart.objects.get(user=request.user)
                cart_items = cart.items.all()
                if not cart_items:
                    return Response({"error": "Cart is empty"}, status=400)

                total_amount = sum(item.get_total() for item in cart_items)
                
                # Pre-check stock for all items
                for item in cart_items:
                    if item.product.quantity < item.quantity:
                        return Response({"error": f"Insufficient stock for {item.product.name}. Available: {item.product.quantity}"}, status=400)

                order = Order.objects.create(
                    user=request.user,
                    order_number=order_number,
                    payment_method=payment_mode,
                    transaction_id=transaction_id,
                    total_amount=total_amount,
                    subtotal=total_amount,
                    payment_status='completed'
                )

                # Create Payment record
                Payment.objects.create(
                    order=order,
                    user=request.user,
                    method=payment_mode if payment_mode in dict(Payment.PAYMENT_METHOD_CHOICES) else 'cod',
                    amount=total_amount,
                    transaction_id=transaction_id,
                    status='completed',
                    completed_at=timezone.now().replace(second=0, microsecond=0)
                )

                from superAdmin.models import CommissionSetting
                for item in cart_items:
                    # --- STOCK REDUCTION LOGIC ---
                    product_obj = item.product
                    product_obj.quantity -= item.quantity
                    product_obj.save(update_fields=['quantity'])
                    # -----------------------------

                    comm_data = CommissionSetting.get_commission_for_product(item.product)
                    commission_rate = Decimal(str(comm_data['rate']))
                    basic_fee = Decimal(str(comm_data.get('basic_fee', 0)))
                    if comm_data['type'] == 'percentage':
                        commission_amount = (item.get_total() * commission_rate) / 100 + basic_fee
                    else:
                        commission_amount = commission_rate + basic_fee
                        
                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        vendor=item.product.vendor,
                        product_name=item.product.name,
                        quantity=item.quantity,
                        product_price=item.product.price,
                        subtotal=item.get_total(),
                        commission_rate=commission_rate,
                        commission_amount=commission_amount
                    )
                cart.items.all().delete()

    except Cart.DoesNotExist:
        return Response({"error": "Cart not found"}, status=404)
    except Exception as e:
        return Response({"error": f"Database Error: {str(e)}"}, status=500)

    if request.accepted_renderer.format == 'json':
        return Response({
            "success": True,
            "message": "Order placed successfully",
            "order_number": order_number,
            "order_id": order.id
        })
    
    return redirect('my_orders')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    if request.accepted_renderer.format == 'json':
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)
        
    return render(request, "my_orders.html", {"orders": orders})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def address_page(request):
    if request.method == 'POST':
        # Use Serializer for API/JSON requests
        if request.accepted_renderer.format == 'json':
            # Map frontend field names to model field names
            data = request.data.copy()
            if 'address' in data and 'address_line1' not in data:
                data['address_line1'] = data.pop('address')
            
            serializer = AddressSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response({
                    "message": "Address saved successfully",
                    "address": serializer.data
                }, status=201)
            return Response(serializer.errors, status=400)
        
        # Fallback for traditional HTML forms
        form = AddressForm(request.POST)
        if form.is_valid():
            address = form.save(commit=False)
            address.user = request.user
            address.save()
            return redirect('address_page')

    addresses = Address.objects.filter(user=request.user).order_by('-created_at')[:1]
    
    if request.accepted_renderer.format == 'json':
        serializer = AddressSerializer(addresses, many=True)
        return Response({"addresses": serializer.data})
        
    form = AddressForm()
    return render(request, "address.html", {"addresses": addresses, "form": form})

@api_view(['POST', 'GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def delete_address(request, id):
    address = get_object_or_404(Address, id=id, user=request.user)
    address.delete()
    
    if request.accepted_renderer.format == 'json':
        return Response({"message": "Address deleted successfully"})
        
    return redirect('address_page')

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_address(request, id):
    address = get_object_or_404(Address, id=id, user=request.user)
    
    # Map frontend field names to model field names
    data = request.data.copy()
    if 'address' in data and 'address_line1' not in data:
        data['address_line1'] = data.pop('address')
    
    serializer = AddressSerializer(address, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "Address updated successfully",
            "address": serializer.data
        })
    return Response(serializer.errors, status=400)

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)
    return redirect('user_login')

# @login_required
# def review_product(request, product_id):
#     product = get_object_or_404(Product, id=product_id)
#     user = request.user
#     if request.method == "POST":
#         rating = request.POST.get('rating')
#         if rating and rating.isdigit() and 1 <= int(rating) <= 5:
#             Review.objects.create(
#                 user=request.user,
#                 Product=product,
#                 rating=int(rating),
#                 comment=request.POST.get('comment', ''),
#                 pictures=request.FILES.get('pictures')
#             )
#             return redirect('home')
#         return render(request, 'review.html', {'product': product, 'error': 'Please provide a valid rating between 1 and 5.'})
#     return render(request, 'review.html', {'product': product})

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id, status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False)
    user_review = None
    can_edit_review = False
    days_left = 0
    
    if request.user.is_authenticated:
        user_review = Review.objects.filter(user=request.user, Product=product).first()
        if user_review:
            time_diff = timezone.now() - user_review.created_at
            if time_diff.days < 5:
                can_edit_review = True
                days_left = 5 - time_diff.days

    reviews = Review.objects.filter(Product=product).order_by('-created_at')
    
    if request.accepted_renderer.format == 'json':
        product_data = ProductSerializer(product, context={'request': request}).data
        reviews_data = ReviewSerializer(reviews, many=True, context={'request': request}).data
        return Response({
            "product": product_data,
            "reviews": reviews_data,
            "user_review": ReviewSerializer(user_review, context={'request': request}).data if user_review else None,
            "can_edit_review": can_edit_review,
            "days_left": days_left
        })

    return render(request, "user_product_detail.html", {
        "product": product,
        "reviews": reviews,
        "user_review": user_review,
        "can_edit_review": can_edit_review,
        "days_left": days_left
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review_api(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    user_review = Review.objects.filter(user=request.user, Product=product).first()
    
    if user_review:
        time_diff = timezone.now() - user_review.created_at
        if time_diff.days >= 5:
            return Response({"error": "Review editing window (5 days) has passed"}, status=403)
        serializer = ReviewSerializer(user_review, data=request.data, partial=True)
    else:
        serializer = ReviewSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(user=request.user, Product=product)
        return Response(serializer.data, status=201 if not user_review else 200)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review_api(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    user_review = Review.objects.filter(user=request.user, Product=product).first()
    
    if not user_review:
        return Response({"error": "Review not found"}, status=404)
        
    time_diff = timezone.now() - user_review.created_at
    if time_diff.days >= 5:
        return Response({"error": "Review deletion window (5 days) has passed"}, status=403)
        
    user_review.delete()
    return Response({"message": "Review deleted successfully"})

# @login_required
# def user_reviews(request):
#     reviews = Review.objects.filter(user=request.user)
#     return render(request, 'user_reviews.html', {'reviews': reviews})

# =========================================================
# PASSWORD RESET FLOW
# =========================================================
reset_tokens = {}

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def auth_page(request):
    page = request.GET.get("page", "login")

    # FORGOT PASSWORD
    if page == "forgot" and request.method == "POST":
        email = request.data.get("email") or request.POST.get("email")
        user = AuthUser.objects.filter(email=email).first()

        if user:
            token = str(uuid.uuid4())
            reset_tokens[token] = user.id

            # Dynamically determine the frontend URL
            # 1. Try Origin header (sent by browsers)
            # 2. Try Referer header (sent by browsers)
            # 3. Fallback to extracting host from current request if mobile/other
            frontend_origin = request.headers.get('Origin') or request.headers.get('Referer', '')
            
            if frontend_origin:
                from urllib.parse import urlparse
                parsed = urlparse(frontend_origin)
                frontend_origin = f"{parsed.scheme}://{parsed.netloc}"
            else:
                # Absolute fallback: if we can't detect, assume it's the same host as backend but on frontend port
                # This helps on mobile where headers might be stripped
                host = request.get_host().split(':')[0] # Get IP or domain without port
                frontend_origin = f"http://{host}:5173"

            link = f"{frontend_origin.rstrip('/')}/reset-password?token={token}"

            send_mail(
                "Password Reset Request",
                f"Click this link to reset password:\n{link}",
                settings.EMAIL_HOST_USER,
                [email]
            )

            return Response({"message": "Mail sent successfully ✅"}, status=200)
        else:
            return Response({"message": "Email not registered ❌"}, status=404)

    # RESET PASSWORD
    if page == "reset" and request.method == "POST":
        token = request.GET.get("token")

        if token in reset_tokens:
            p1 = request.data.get("password1") or request.POST.get("password1")
            p2 = request.data.get("password2") or request.POST.get("password2")

            if p1 == p2 and p1 is not None:
                user = AuthUser.objects.get(id=reset_tokens[token])
                # Strip whitespace to avoid accidental login failures
                user.set_password(p1.strip())
                user.save()
                del reset_tokens[token]

                return Response({"message": "Password changed successfully ✅"}, status=200)

            return Response({"message": "Passwords do not match ❌"}, status=400)
        
        return Response({"message": "Invalid or expired reset token ❌"}, status=400)

    return render(request, "auth.html", {"page": page})

# ======================================
# 🔥 Trending Products Logic
# ======================================
@api_view(['GET'])
@permission_classes([AllowAny])
def trending_products(request):
    from user.models import Review
    seven_days_ago = timezone.now() - timedelta(days=7)

    try:
        products = Product.objects.annotate(
            recent_review_count=Count(
                'reviews',
                filter=Q(reviews__created_at__gte=seven_days_ago)
            )
        ).annotate(
            trending_score=ExpressionWrapper(
                (F('recent_review_count') * 2.0) + (F('average_rating') * 3.0),
                output_field=FloatField()
            )
        ).filter(
            trending_score__gt=0
        ).order_by(
            '-trending_score',
            '-total_reviews'
        )[:10]
    except Exception:
        products = Product.objects.none()

    # Apply Vendor Status Filtering
    products = products.filter(status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False)

    # ✅ Fallback: if no trending products found, return top-rated or newest products
    if not products.exists():
        # Try products that have reviews
        products = Product.objects.filter(
            status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False
        ).annotate(
            review_count=Count('reviews')
        ).filter(
            review_count__gt=0
        ).order_by('-review_count')[:10]

    # Final fallback: just return newest active products
    if not products.exists():
        products = Product.objects.filter(
            status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False
        ).order_by('-created_at')[:10]

    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


# ======================================
# 🔍 Most Searched Products (ML-Based)
# ======================================

@api_view(['POST'])
@permission_classes([AllowAny])
def log_search(request):
    """
    Records a user search query into SearchLog.
    Called silently from the frontend on every search keystroke (debounced).
    """
    from user.models import SearchLog
    query = (request.data.get('query') or '').strip()
    if len(query) < 2:
        return Response({'status': 'ignored'})

    user = request.user if request.user.is_authenticated else None
    session_key = request.session.session_key or ''

    SearchLog.objects.create(
        query=query.lower(),
        user=user,
        session_key=session_key
    )
    return Response({'status': 'logged'})


@api_view(['GET'])
@permission_classes([AllowAny])
def most_searched_products(request):
    """
    ML-based endpoint: returns products ranked by how often they were searched.

    Algorithm (lightweight TF-IDF-style matching):
    1. Aggregate the most frequently searched queries (last 30 days).
    2. Tokenize each query into words.
    3. For every active product, compute a relevance score:
           score = sum over all query-tokens that appear in product name
                   of (token_count / max_count)
       This gives a frequency-weighted name-match ranking.
    4. Return the top-10 products sorted by score descending.
    """
    import re
    from collections import defaultdict
    from user.models import SearchLog

    def _safe_fallback(request):
        """Return newest active products as a safe cold-start fallback."""
        products = Product.objects.filter(
            status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False
        ).annotate(
            review_count=Count('reviews')
        ).order_by('-review_count', '-created_at')[:10]
        return ProductSerializer(products, many=True, context={'request': request}).data

    try:
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Step 1: Fetch aggregated query frequencies from last 30 days
        recent_logs = list(
            SearchLog.objects
            .filter(created_at__gte=thirty_days_ago)
            .values('query')
            .annotate(count=Count('query'))
            .order_by('-count')[:200]
        )

        if not recent_logs:
            # Cold-start: no search logs yet, return newest/most-reviewed products
            return Response(_safe_fallback(request))

        max_count = recent_logs[0]['count'] or 1

        # Step 2: Build token → weight mapping (TF-IDF-like)
        token_weights = defaultdict(float)
        stop_words = {'the', 'a', 'an', 'is', 'in', 'on', 'at', 'for',
                      'of', 'and', 'or', 'to', 'with', 'by'}
        for row in recent_logs:
            tokens = re.findall(r'\w+', row['query'].lower())
            weight = row['count'] / max_count  # normalise to [0, 1]
            for token in tokens:
                if token not in stop_words and len(token) >= 2:
                    token_weights[token] += weight

        # Step 3: Score every active product (no non-existent field access)
        products_qs = list(Product.objects.filter(status='active', is_blocked=False, vendor__is_active=True, vendor__is_blocked=False))
        scored = []
        for product in products_qs:
            name_tokens = set(re.findall(r'\w+', product.name.lower()))
            score = sum(token_weights.get(t, 0) for t in name_tokens)
            # Safe attribute access — some products might have the field set by signals
            rating = float(getattr(product, 'average_rating', 0) or 0)
            score += rating * 0.05
            if score > 0:
                scored.append((score, product))

        # Step 4: Sort and take top-10
        scored.sort(key=lambda x: x[0], reverse=True)
        top_products = [p for _, p in scored[:10]]

        # Final fallback if nothing matched
        if not top_products:
            return Response(_safe_fallback(request))

        serializer = ProductSerializer(top_products, many=True, context={'request': request})
        return Response(serializer.data)

    except Exception as exc:
        # Never let the ML endpoint crash — always return something useful
        import logging
        logging.getLogger(__name__).error("most_searched_products error: %s", exc)
        return Response(_safe_fallback(request))

