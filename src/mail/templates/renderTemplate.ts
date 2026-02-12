/**
 * Template renderer
 * Replaces variables in templates
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { MailPayload, OrderConfirmationPayload } from "../types";

/**
 * Read template file from disk
 */
function readTemplate(filename: string): string {
  try {
    const templatePath = join(process.cwd(), "src", "mail", "templates", filename);
    return readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`[Mail] Error reading template ${filename}:`, error);
    throw new Error(`Archivo de plantilla no encontrado: ${filename}`);
  }
}

/**
 * Get template content (cached in memory)
 */
const templates: Record<string, { html: string; txt: string }> = {
  welcome: {
    html: readTemplate("welcome.html"),
    txt: readTemplate("welcome.txt"),
  },
  "verify-email": {
    html: readTemplate("verify-email.html"),
    txt: readTemplate("verify-email.txt"),
  },
  "reset-password": {
    html: readTemplate("reset-password.html"),
    txt: readTemplate("reset-password.txt"),
  },
  "order-confirmation": {
    html: readTemplate("order-confirmation.html"),
    txt: readTemplate("order-confirmation.txt"),
  },
  "order-status": {
    html: readTemplate("order-status.html"),
    txt: readTemplate("order-status.txt"),
  },
  generic: {
    html: readTemplate("generic.html"),
    txt: readTemplate("generic.txt"),
  },
};

/**
 * Get status-specific content for order status emails
 */
function getStatusContent(status: string): { title: string; message: string } {
  switch (status) {
    case "processing":
      return {
        title: "¡Tu pedido está siendo preparado!",
        message: "Estamos preparando tu pedido con mucho cuidado. Te notificaremos cuando sea enviado.",
      };
    case "shipped":
      return {
        title: "¡Tu pedido ha sido enviado!",
        message: "Tu pedido está en camino. Pronto llegará a tu puerta.",
      };
    case "delivered":
      return {
        title: "¡Tu pedido ha sido entregado!",
        message: "Tu pedido ha sido entregado exitosamente. ¡Gracias por tu compra!",
      };
    default:
      return {
        title: "Actualización de tu pedido",
        message: "El estado de tu pedido ha sido actualizado.",
      };
  }
}

/**
 * Format price for display
 */
function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "$0.00";
  return `$${numPrice.toFixed(2)} MXN`;
}

/**
 * Replace variables in template
 */
function replaceVariables(template: string, payload: MailPayload): string {
  let result = template;

  // Replace common variables
  if ("name" in payload && payload.name) {
    result = result.replace(/\{\{name\}\}/g, payload.name);
  }

  if ("verifyUrl" in payload && payload.verifyUrl) {
    result = result.replace(/\{\{verifyUrl\}\}/g, payload.verifyUrl);
  }

  if ("resetUrl" in payload && payload.resetUrl) {
    result = result.replace(/\{\{resetUrl\}\}/g, payload.resetUrl);
  }

  if ("message" in payload && payload.message) {
    // For generic emails, replace message (may contain HTML or plain text)
    result = result.replace(/\{\{message\}\}/g, payload.message);
  }

  // Replace order confirmation variables
  if ("orderNumber" in payload && payload.orderNumber) {
    result = result.replace(/\{\{orderNumber\}\}/g, payload.orderNumber);
  }

  if ("orderDate" in payload && payload.orderDate) {
    result = result.replace(/\{\{orderDate\}\}/g, payload.orderDate);
  }

  if ("totalAmount" in payload && payload.totalAmount !== undefined) {
    const formattedTotal = formatPrice(payload.totalAmount);
    result = result.replace(/\{\{totalAmount\}\}/g, formattedTotal);
  }

  if ("items" in payload && Array.isArray(payload.items)) {
    // Check if this is HTML or TXT template
    const isHtml = template.includes("<html") || template.includes("<table");
    const items = payload.items as OrderConfirmationPayload["items"];
    
    if (isHtml) {
      // Generate items HTML table rows
      const itemsHtml = items
        .map(
          (item) => `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 12px 0; font-size: 14px; color: #333333;">
          ${item.name} × ${item.quantity}
        </td>
        <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 600; color: #000000;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>
    `
        )
        .join("");
      result = result.replace(/\{\{items\}\}/g, itemsHtml);
    } else {
      // Generate items text format
      const itemsTxt = items
        .map(
          (item) =>
            `- ${item.name} × ${item.quantity} - ${formatPrice(item.price * item.quantity)}`
        )
        .join("\n");
      result = result.replace(/\{\{items\}\}/g, itemsTxt);
    }
  }

  if ("shippingAddress" in payload && payload.shippingAddress) {
    result = result.replace(/\{\{shippingAddress\}\}/g, payload.shippingAddress);
  }

  if ("orderUrl" in payload && payload.orderUrl) {
    // For order-status template, just replace the URL directly
    if (template.includes("order-status") || template.includes("Ver detalles del pedido")) {
      result = result.replace(/\{\{orderUrl\}\}/g, payload.orderUrl);
    } else {
      const isHtml = template.includes("<html") || template.includes("<table");
      if (isHtml) {
        const orderUrlHtml = `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${payload.orderUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;">
                  Ver detalles del pedido
                </a>
              </div>
            `;
        result = result.replace(/\{\{orderUrl\}\}/g, orderUrlHtml);
      } else {
        const orderUrlTxt = `\n\nVer detalles del pedido: ${payload.orderUrl}\n`;
        result = result.replace(/\{\{orderUrl\}\}/g, orderUrlTxt);
      }
    }
  } else {
    // Remove orderUrl placeholder if not provided
    result = result.replace(/\{\{orderUrl\}\}/g, "");
  }

  // Handle order status specific variables
  if ("status" in payload && payload.status) {
    const statusContent = getStatusContent(payload.status);
    result = result.replace(/\{\{statusTitle\}\}/g, statusContent.title);
    result = result.replace(/\{\{statusMessage\}\}/g, statusContent.message);
    
    // Handle conditional blocks for status icons
    const isProcessing = payload.status === "processing";
    const isShipped = payload.status === "shipped";
    const isDelivered = payload.status === "delivered";
    
    // Simple conditional replacement (remove blocks that don't match)
    if (isProcessing) {
      result = result.replace(/\{\{#if isProcessing\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");
      result = result.replace(/\{\{#if isShipped\}\}[\s\S]*?\{\{\/if\}\}/g, "");
      result = result.replace(/\{\{#if isDelivered\}\}[\s\S]*?\{\{\/if\}\}/g, "");
    } else if (isShipped) {
      result = result.replace(/\{\{#if isShipped\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");
      result = result.replace(/\{\{#if isProcessing\}\}[\s\S]*?\{\{\/if\}\}/g, "");
      result = result.replace(/\{\{#if isDelivered\}\}[\s\S]*?\{\{\/if\}\}/g, "");
    } else if (isDelivered) {
      result = result.replace(/\{\{#if isDelivered\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");
      result = result.replace(/\{\{#if isProcessing\}\}[\s\S]*?\{\{\/if\}\}/g, "");
      result = result.replace(/\{\{#if isShipped\}\}[\s\S]*?\{\{\/if\}\}/g, "");
    }
  }

  // Clean up any remaining unused variables
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result;
}

/**
 * Render template by name
 */
export async function renderTemplate(
  templateName: string,
  payload: MailPayload
): Promise<{ html: string; txt: string }> {
  const template = templates[templateName];

  if (!template) {
    throw new Error(`Plantilla "${templateName}" no encontrada`);
  }

  return {
    html: replaceVariables(template.html, payload),
    txt: replaceVariables(template.txt, payload),
  };
}
