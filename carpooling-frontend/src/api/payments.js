import api from './client';

export const getMyTransactions = () =>
  api.get('/payments/my');

export const initiatePayment = (rideId, amount, paymentMethod) =>
  api.post('/payments/initiate', null, { params: { rideId, amount, paymentMethod } });

export const confirmPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
  api.post('/payments/confirm', null, {
    params: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
  });

export const refundPayment = (transactionId) =>
  api.post(`/payments/${transactionId}/refund`);
