import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Showtime from '../models/Showtime.js';
import {
  isPaymentConfigured,
  getRazorpayClient,
  createProviderOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/paymentService.js';

/**
 * @desc    Create a payment provider order for an eligible pending booking
 * @route   POST /api/payments/create-order
 * @access  Private (USER, ADMIN)
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId is required to create a payment order',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format',
      });
    }

    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Booking ownership check
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to create a payment order for this booking',
      });
    }

    // Verify booking state
    if (booking.status === 'confirmed' || booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already confirmed and paid',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a payment order for a cancelled booking',
      });
    }

    if (new Date(booking.showtime.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot proceed with payment: The showtime has already started or elapsed',
      });
    }

    // Check payment gateway configuration
    if (!isPaymentConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'Payment gateway is currently not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment to enable live payments.',
        code: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
      });
    }

    // Idempotency: If an active created order exists for this booking, return it instead of creating duplicate orders
    const existingPayment = await Payment.findOne({
      booking: booking._id,
      status: 'created',
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Reusing existing active payment order',
        order: {
          id: existingPayment.orderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          receipt: existingPayment.receipt,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    // Authoritative server-side price in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(booking.pricing.totalAmount * 100);

    const razorpayOrder = await createProviderOrder({
      amountInPaise,
      currency: 'INR',
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        bookingReference: booking.bookingReference,
      },
    });

    // Record payment order
    const payment = await Payment.create({
      orderId: razorpayOrder.id,
      booking: booking._id,
      user: req.user._id,
      amount: amountInPaise,
      currency: razorpayOrder.currency || 'INR',
      status: 'created',
      provider: 'razorpay',
      receipt: booking.bookingReference,
    });

    booking.paymentOrderId = razorpayOrder.id;
    booking.payment = payment._id;
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cryptographically verify payment signature and confirm booking
 * @route   POST /api/payments/verify
 * @access  Private (USER, ADMIN)
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          'bookingId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format',
      });
    }

    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership check
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to verify payment for this booking',
      });
    }

    // Ensure booking belongs to the provided order
    if (booking.paymentOrderId && booking.paymentOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Provider order ID mismatch with booking record',
      });
    }

    // Check payment gateway configuration
    if (!isPaymentConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'Payment gateway credentials are not configured. Cannot verify payment signatures without RAZORPAY_KEY_SECRET.',
        code: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
      });
    }

    // Anti-replay check: ensure payment ID was not already captured on another booking
    const duplicatePayment = await Payment.findOne({
      paymentId: razorpay_payment_id,
      status: 'captured',
    });

    if (duplicatePayment) {
      return res.status(400).json({
        success: false,
        message:
          'Duplicate payment transaction detected. This transaction identifier has already been processed.',
      });
    }

    // Cryptographic signature verification
    const isSignatureValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isSignatureValid) {
      // Record failed verification attempt
      await Payment.updateOne(
        { orderId: razorpay_order_id },
        {
          $set: {
            status: 'failed',
            failureReason: 'HMAC signature verification failed',
            paymentId: razorpay_payment_id,
          },
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature verification failed: Invalid payment signature.',
      });
    }

    // Update Payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        $set: {
          status: 'captured',
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        },
      },
      { returnDocument: 'after' }
    );

    // Atomic conditional booking confirmation
    // Only transition if booking is still in pending_payment status (prevents race with concurrent cancellation)
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: 'pending_payment',
        paymentStatus: 'pending',
      },
      {
        $set: {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentOrderId: razorpay_order_id,
          payment: payment ? payment._id : booking.payment,
          'paymentDetails.provider': 'razorpay',
          'paymentDetails.orderId': razorpay_order_id,
          'paymentDetails.transactionId': razorpay_payment_id,
          'paymentDetails.paidAt': new Date(),
        },
      },
      { returnDocument: 'after' }
    )
      .populate('movie', 'title slug poster certificate duration')
      .populate('theatre', 'name slug location city')
      .populate('screen', 'screenNumber name format')
      .populate('showtime', 'startTime endTime format language');

    if (!updatedBooking) {
      // Booking was cancelled concurrently before payment succeeded
      return res.status(409).json({
        success: false,
        message:
          'Booking was cancelled while payment was processing. Your payment will be queued for refund.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle Razorpay Webhook events idempotently with raw body signature verification
 * @route   POST /api/payments/webhook
 * @access  Public (Provider verification via x-razorpay-signature)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(503).json({
        success: false,
        message: 'RAZORPAY_WEBHOOK_SECRET is not configured on server',
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing x-razorpay-signature header',
      });
    }

    if (!req.rawBody) {
      return res.status(400).json({
        success: false,
        message: 'Raw request body buffer unavailable for signature verification',
      });
    }

    const isValid = verifyWebhookSignature({
      rawBody: req.rawBody,
      signature,
      secret: webhookSecret,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const { event, payload } = req.body;
    const eventId =
      req.headers['x-razorpay-event-id'] ||
      `${event}_${payload?.payment?.entity?.id || Date.now()}`;

    // Extract Order & Payment IDs
    const orderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
    const paymentId = payload?.payment?.entity?.id;

    if (orderId) {
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        // Idempotency: Check if event already processed
        const alreadyProcessed = payment.webhookEvents.some((e) => e.eventId === eventId);
        if (alreadyProcessed) {
          return res.status(200).json({
            success: true,
            message: 'Webhook event already processed (idempotent)',
          });
        }

        // Process event types
        if (event === 'payment.captured' || event === 'order.paid') {
          payment.status = 'captured';
          if (paymentId) payment.paymentId = paymentId;

          await Booking.findOneAndUpdate(
            {
              _id: payment.booking,
              status: 'pending_payment',
              paymentStatus: 'pending',
            },
            {
              $set: {
                status: 'confirmed',
                paymentStatus: 'paid',
                'paymentDetails.provider': 'razorpay',
                'paymentDetails.orderId': orderId,
                'paymentDetails.transactionId': paymentId || payment.paymentId,
                'paymentDetails.paidAt': new Date(),
              },
            }
          );
        } else if (event === 'payment.failed') {
          payment.status = 'failed';
          payment.failureReason =
            payload?.payment?.entity?.error_description || 'Payment failed on provider';
        } else if (event === 'refund.processed') {
          payment.status = 'refunded';
          payment.refundDetails = {
            refundId: payload?.refund?.entity?.id || null,
            amount: payload?.refund?.entity?.amount || 0,
            status: 'processed',
            refundedAt: new Date(),
          };

          await Booking.findByIdAndUpdate(payment.booking, {
            $set: {
              paymentStatus: 'refunded',
              'cancellationDetails.refundStatus': 'processed',
            },
          });
        }

        payment.webhookEvents.push({
          eventId,
          eventType: event,
          receivedAt: new Date(),
          payload,
        });

        await payment.save();
      }
    }

    res.status(200).json({
      success: true,
      status: 'ok',
      message: `Webhook event '${event}' processed successfully`,
    });
  } catch (error) {
    next(error);
  }
};
