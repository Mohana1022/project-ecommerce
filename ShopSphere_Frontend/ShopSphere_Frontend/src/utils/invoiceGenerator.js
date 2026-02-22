/**
 * Generates and triggers a print for an order invoice
 * @param {Object} order - The order details
 */
export const generateInvoice = (order) => {
    const invoiceWindow = window.open('', '_blank');

    // Handle both full order (array of items) and single order item (vendor view)
    let items = order.items || [];
    if (items.length === 0 && order.product) {
        items = [{
            name: order.product,
            quantity: order.quantity,
            price: order.price,
            subtotal: order.subtotal || (order.price * order.quantity)
        }];
    }

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${parseFloat(item.price).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${parseFloat(item.subtotal || (item.price * item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${order.order_number}</title>
            <style>
                body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; padding: 40px; }
                .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 10px; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .logo { font-size: 28px; font-weight: 900; color: #7c3aed; letter-spacing: -1px; }
                .status { padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #f3f4f6; }
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                h3 { font-size: 12px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; font-weight: 900; color: #4B5563; text-transform: uppercase; }
                .totals { margin-left: auto; width: 300px; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
                .grand-total { border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; font-size: 20px; font-weight: 900; color: #7c3aed; }
                @media print {
                    body { padding: 0; }
                    .invoice-box { border: none; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <div class="logo">ShopSphere</div>
                    <div style="text-align: right">
                        <div style="font-weight: 900; font-size: 20px;">INVOICE</div>
                        <div style="color: #6b7280; font-size: 14px;">#${order.invoice_number || 'INV-' + order.order_number}</div>
                    </div>
                </div>

                <div class="details">
                    <div>
                        <h3>Billed To</h3>
                        <div style="font-weight: bold; font-size: 16px;">${order.customer_name || 'Customer'}</div>
                        <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">
                            ${order.delivery_address || 'Address not provided'}
                        </div>
                        <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">${order.customer_email || ''}</div>
                    </div>
                    <div style="text-align: right">
                        <h3>Order Details</h3>
                        <div style="font-size: 14px; color: #6b7280;">Date: ${new Date(order.created_at).toLocaleDateString()}</div>
                        <div style="font-size: 14px; color: #6b7280;">Payment: ${order.payment_method || 'N/A'}</div>
                        <div style="font-size: 14px; color: #6b7280;">Status: ${order.payment_status || 'Paid'}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>₹${parseFloat(order.subtotal || order.total_amount).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (Estimated)</span>
                        <span>₹${parseFloat(order.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping</span>
                        <span>₹${parseFloat(order.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Total Amount</span>
                        <span>₹${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>

                <div style="margin-top: 60px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
                    Thank you for shopping with ShopSphere! If you have any questions, contact us at support@shopsphere.com
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    invoiceWindow.document.write(htmlContent);
    invoiceWindow.document.close();
};
