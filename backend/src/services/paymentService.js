import Razorpay from 'razorpay';
import crypto from 'crypto';

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
