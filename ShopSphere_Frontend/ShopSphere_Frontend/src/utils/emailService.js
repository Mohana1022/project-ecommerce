import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';

// NOTE: These should ideally be in environment variables
// VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_shopsphere';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_order_conf';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

/**
 * Sends an order confirmation email via EmailJS
 * @param {Object} orderData - The order details
 */
export const sendOrderConfirmationEmail = async (orderData) => {
    // Check if configuration is missing or using placeholders
    const isConfigured =
        SERVICE_ID && SERVICE_ID !== 'your_service_id' &&
        TEMPLATE_ID && TEMPLATE_ID !== 'your_template_id' &&
        PUBLIC_KEY && PUBLIC_KEY !== 'your_public_key';

    if (!isConfigured) {
        console.warn('EmailJS is not fully configured. Please provide actual values in your .env file.');
        return false;
    }

    try {
        console.log('Attempting to send email for order:', orderData.order_number);

        const templateParams = {
            user_name: orderData.customer_name || 'Customer',
            customer_email: orderData.customer_email,
            order_id: orderData.order_number || orderData.order_pk,
            invoice_number: orderData.invoice_number,
            order_date: orderData.date || new Date(orderData.order_created_at).toLocaleDateString(),

            product_name: orderData.product,
            quantity: orderData.quantity,
            unit_price: `₹${parseFloat(orderData.price || 0).toFixed(2)}`,
            total_amount: `₹${parseFloat(orderData.order_total || 0).toFixed(2)}`,

            payment_method: orderData.payment_method === 'ONLINE' ? 'Online / UPI' : 'Cash on Delivery',
            payment_status: (orderData.payment_status || 'PENDING').toUpperCase(),

            shipping_address: orderData.customer_address ?
                `${orderData.customer_address.address_line1}, ${orderData.customer_address.city}, ${orderData.customer_address.state} - ${orderData.customer_address.pincode}` :
                'Address not provided',
            billing_address: orderData.customer_address ?
                `${orderData.customer_address.address_line1}, ${orderData.customer_address.city}, ${orderData.customer_address.state} - ${orderData.customer_address.pincode}` :
                'Address not provided',

            tracking_link: `${window.location.origin}/track-order/${orderData.order_number || orderData.order_pk}`,
            support_email: 'support@shopsphere.com'
        };

        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );

        console.log('EmailJS Success:', response.status, response.text);
        toast.success('Confirmation email sent to customer!');
        return true;
    } catch (error) {
        console.error('EmailJS Error:', error);
        toast.error('Failed to send confirmation email. Check console for details.');
        return false;
    }
};
