import { format } from "date-fns";
import { formatPeso } from "./subscription-helpers";

/**
 * generateInvoiceNumber
 * Format: GP-YYYYMM-NNNN
 * e.g., GP-202601-0001
 */
export async function generateInvoiceNumber(supabase: any): Promise<string> {
    const now = new Date();
    const prefix = `GP-${format(now, "yyyyMM")}`;
    
    // Find the latest invoice number for this month
    const { data: lastInvoice } = await supabase
        .from("invoices")
        .select("invoice_number")
        .like("invoice_number", `${prefix}-%`)
        .order("invoice_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    let sequence = 1;
    if (lastInvoice) {
        const parts = lastInvoice.invoice_number.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) {
            sequence = lastSeq + 1;
        }
    }

    const sequentialPart = sequence.toString().padStart(4, "0");
    return `${prefix}-${sequentialPart}`;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    price: number;
    amount: number;
}

export interface InvoiceData {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    businessName: string;
    ownerName: string;
    ownerEmail: string;
    ownerAddress?: string;
    items: InvoiceItem[];
    subtotal: number;
    total: number;
    paymentMethod: string;
    referenceNumber?: string;
}

/**
 * calculateInvoiceItems
 * Determines line items based on payment description and amount.
 */
export function calculateInvoiceItems(payment: any): InvoiceItem[] {
    return [{
        description: payment.description,
        quantity: 1,
        price: payment.amount,
        amount: payment.amount
    }];
}

/**
 * formatInvoiceData
 * Prepares a complete invoice object for rendering or storage.
 */
export function formatInvoiceData(
    payment: any, 
    invoiceNumber: string, 
    listing: any, 
    owner: any
): InvoiceData {
    const items = calculateInvoiceItems(payment);
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return {
        invoiceNumber,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        status: "paid",
        businessName: listing.business_name,
        ownerName: owner.full_name || owner.email,
        ownerEmail: owner.email,
        items,
        subtotal: total,
        total,
        paymentMethod: payment.payment_method,
        referenceNumber: payment.reference_number
    };
}

/**
 * generateInvoiceHTML
 * Generates a professional HTML string for the invoice.
 */
export function generateInvoiceHTML(data: InvoiceData): string {
    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right;">${formatPeso(item.price)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; font-weight: bold;">${formatPeso(item.amount)}</td>
        </tr>
    `).join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: sans-serif; color: #2d3748; line-height: 1.5; }
            .container { max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; }
            .invoice-info { text-align: right; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .bill-to h3 { margin-top: 0; color: #718096; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f7fafc; padding: 12px; text-align: left; border-bottom: 2px solid #edf2f7; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 20px; font-weight: bold; color: #1a202c; border-top: 2px solid #edf2f7; margin-top: 8px; padding-top: 16px; }
            .footer { text-align: center; color: #a0aec0; font-size: 12px; margin-top: 60px; border-top: 1px solid #edf2f7; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GalaPo City Directory</div>
                <div class="invoice-info">
                    <h1 style="margin: 0; font-size: 32px;">INVOICE</h1>
                    <p style="margin: 4px 0; color: #718096;"># ${data.invoiceNumber}</p>
                </div>
            </div>

            <div class="details">
                <div class="bill-to">
                    <h3>Bill To</h3>
                    <p style="margin: 0; font-weight: bold; font-size: 18px;">${data.ownerName}</p>
                    <p style="margin: 4px 0;">${data.businessName}</p>
                    <p style="margin: 4px 0;">${data.ownerEmail}</p>
                </div>
                <div class="invoice-info">
                    <p><strong>Date Issued:</strong> ${format(new Date(data.issueDate), "MMMM d, yyyy")}</p>
                    <p><strong>Payment Method:</strong> ${data.paymentMethod.toUpperCase()}</p>
                    ${data.referenceNumber ? `<p><strong>Reference #:</strong> ${data.referenceNumber}</p>` : ""}
                    <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAID</span></p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
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
                    <span>${formatPeso(data.subtotal)}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Total</span>
                    <span>${formatPeso(data.total)}</span>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for your business!</p>
                <p>&copy; ${new Date().getFullYear()} GalaPo City Directory. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
