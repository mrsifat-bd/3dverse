// Pure, email-safe HTML templates. No secrets, no server-only imports — safe to
// import on the client (for the admin preview) and on the server (for sending).
// Table-based layout + inline CSS for broad email-client support.
import { SITE_URL, BUSINESS } from '@/lib/config'

export const EMAIL_TYPES = ['ORDER_CONFIRMED', 'SENT_FOR_DELIVERY', 'REVIEW_REQUEST']

const CLAY = '#C0603A'
const INK = '#2C2A26'
const STONE = '#8A8577'
const LINE = '#E4DED2'
const CREAM = '#F4F1EA'
const site = (SITE_URL || 'https://www.3dversebd.com').replace(/\/$/, '')

// Basic HTML escaping — customer name/address are untrusted input.
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
const taka = (n) => '৳' + (Number(n) || 0).toLocaleString('en-IN')

function money(order) {
  const subtotal = Number(order.subtotal) || 0
  const delivery = Number(order.delivery_charge) || 0
  const discount = Number(order.discount) || 0
  return { subtotal, delivery, discount, total: Math.max(0, subtotal + delivery - discount) }
}
function orderDate(order) {
  try {
    return new Date(order.created_at || Date.now()).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return '' }
}

function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td style="border-radius:8px;background:${CLAY};">
    <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a>
  </td></tr></table>`
}

// Shared shell: header (logo + brand), content, footer (real contact info).
export function emailLayout(inner, preheader = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3D Verse</title></head>
<body style="margin:0;padding:0;background:${CREAM};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
    <tr><td style="padding:24px 28px;border-bottom:1px solid ${LINE};">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;"><img src="${site}/logo-mark.png" width="40" height="40" alt="3D Verse" style="display:block;border-radius:6px;"></td>
        <td>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:${INK};">3D Verse</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:${CLAY};text-transform:uppercase;">Dream &bull; Design &bull; Deliver</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${INK};">${inner}</td></tr>
    <tr><td style="padding:20px 28px;border-top:1px solid ${LINE};background:${CREAM};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${STONE};">
      <div style="font-weight:bold;color:${INK};">3D Verse</div>
      <div style="margin-top:4px;">${esc(BUSINESS.location)}</div>
      <div style="margin-top:4px;">${esc(BUSINESS.email)} &nbsp;&bull;&nbsp; ${esc(BUSINESS.phone)}</div>
      <div style="margin-top:4px;"><a href="${site}" style="color:${CLAY};text-decoration:none;">${site.replace(/^https?:\/\//, '')}</a></div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`
}

function itemsTable(order) {
  const items = Array.isArray(order.items) ? order.items : []
  const rows = items.map((i) => {
    const qty = Math.max(1, Math.round(Number(i.qty ?? i.quantity) || 1))
    const unit = Number(i.unit_price ?? i.unit_price_snapshot) || 0
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid ${LINE};">${esc(i.name || i.product_name_snapshot || 'Item')}</td>
      <td align="center" style="padding:8px 0;border-bottom:1px solid ${LINE};color:${STONE};">${qty}</td>
      <td align="right" style="padding:8px 0;border-bottom:1px solid ${LINE};">${taka(unit * qty)}</td>
    </tr>`
  }).join('')
  const m = money(order)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};margin-top:6px;">
    <tr><td style="padding:6px 0;color:${STONE};font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Product</td>
        <td align="center" style="padding:6px 0;color:${STONE};font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Qty</td>
        <td align="right" style="padding:6px 0;color:${STONE};font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Total</td></tr>
    ${rows}
    <tr><td colspan="2" style="padding:8px 0;color:${STONE};">Subtotal</td><td align="right" style="padding:8px 0;">${taka(m.subtotal)}</td></tr>
    <tr><td colspan="2" style="padding:2px 0;color:${STONE};">Delivery charge</td><td align="right" style="padding:2px 0;">${taka(m.delivery)}</td></tr>
    ${m.discount > 0 ? `<tr><td colspan="2" style="padding:2px 0;color:${STONE};">Discount</td><td align="right" style="padding:2px 0;">- ${taka(m.discount)}</td></tr>` : ''}
    <tr><td colspan="2" style="padding:10px 0 0;font-weight:bold;">Total</td><td align="right" style="padding:10px 0 0;font-weight:bold;">${taka(m.total)}</td></tr>
  </table>`
}

export function orderConfirmedEmail(order) {
  const inner = `
    <p style="margin:0 0 14px;">Hello ${esc(order.customer_name || 'there')},</p>
    <p style="margin:0 0 14px;">Thank you for choosing 3D Verse. We truly appreciate your order and are grateful that you chose us.</p>
    <p style="margin:0 0 6px;">Your order has been <strong>confirmed</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:${CREAM};border-radius:10px;">
      <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};">
        <strong>Order ID:</strong> ${esc(order.order_number || '')}<br>
        <strong>Order Date:</strong> ${esc(orderDate(order))}
      </td></tr>
    </table>
    ${itemsTable(order)}
    <p style="margin:18px 0 0;">We'll keep you updated as your order moves through the delivery process.</p>
    <p style="margin:14px 0 0;">Thank you for being a part of 3D Verse.</p>`
  return { subject: 'Thank You for Your Order — 3D Verse', html: emailLayout(inner, 'Your 3D Verse order is confirmed.') }
}

export function sentForDeliveryEmail(order, { trackingCode = '', trackingUrl = '' } = {}) {
  const track = trackingCode || order.steadfast_tracking_code || ''
  const inner = `
    <p style="margin:0 0 14px;">Hello ${esc(order.customer_name || 'there')},</p>
    <p style="margin:0 0 14px;"><strong>Good news!</strong> Your 3D Verse order has been sent for delivery.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;background:${CREAM};border-radius:10px;">
      <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};">
        <strong>Order ID:</strong> ${esc(order.order_number || '')}<br>
        <strong>Courier:</strong> Steadfast Courier${track ? `<br><strong>Tracking ID:</strong> ${esc(track)}` : ''}
      </td></tr>
    </table>
    ${trackingUrl ? button('Track Your Order', trackingUrl) : (track ? '' : `<p style="margin:12px 0 0;color:${STONE};font-size:13px;">Tracking details will be available shortly.</p>`)}
    <p style="margin:16px 0 0;">Thank you for choosing 3D Verse.</p>`
  return { subject: 'Your 3D Verse Order Is On Its Way', html: emailLayout(inner, 'Your order has been sent for delivery.') }
}

export function reviewRequestEmail(order, { reviewUrl = '' } = {}) {
  const inner = `
    <p style="margin:0 0 14px;">Hello ${esc(order.customer_name || 'there')},</p>
    <p style="margin:0 0 14px;">We hope you received your order safely and are happy with your purchase. Thank you for choosing 3D Verse.</p>
    <p style="margin:0 0 6px;">Your feedback means a lot to us and helps us improve our products and service. We'd really appreciate it if you could take a moment to share your experience.</p>
    ${reviewUrl ? button('Leave a Review', reviewUrl) : ''}
    <p style="margin:16px 0 0;">Thank you for supporting 3D Verse.</p>`
  return { subject: 'How Was Your 3D Verse Experience?', html: emailLayout(inner, 'We\'d love your feedback.') }
}

// Single entry point used by the API route and the preview.
export function renderOrderEmail(type, order, opts = {}) {
  if (type === 'ORDER_CONFIRMED') return orderConfirmedEmail(order)
  if (type === 'SENT_FOR_DELIVERY') return sentForDeliveryEmail(order, opts)
  if (type === 'REVIEW_REQUEST') return reviewRequestEmail(order, opts)
  return null
}
