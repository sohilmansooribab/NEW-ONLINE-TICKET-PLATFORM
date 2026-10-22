import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Checks whether Razorpay credentials are fully configured in the environment.
 */
export const isPaymentConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('<your_') &&
    !keySecret.includes('<your_')
  );
};

/**
 * Returns an instantiated Razorpay SDK client if credentials exist.
 * Fails safely if credentials are not configured.
 */
export const getRazorpayClient = () => {
  if (!isPaymentConfigured()) {
    throw new Error(
      'Payment provider is not configured. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.'
    );
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Creates an order on Razorpay.
 * If credentials are not set in test environment, supports injected mock client or throws.
 */
export const createProviderOrder = async ({ amountInPaise, currency = 'INR', receipt, notes = {} }) => {
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
  return order;
};

/**
 * Cryptographically verifies Razorpay Payment Signature using HMAC-SHA256 and constant-time comparison.
 * Algorithm: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature, secret }) => {
  const keySecret = secret || process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is required to verify payment signatures');
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

/**
 * Cryptographically verifies Razorpay Webhook Signature using HMAC-SHA256 and raw request body.
 * Algorithm: HMAC_SHA256(rawRequestBody, webhookSecret) === x-razorpay-signature header
 */
export const verifyWebhookSignature = ({ rawBody, signature, secret }) => {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is required to verify webhook signatures');
  }

  if (!rawBody || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};
