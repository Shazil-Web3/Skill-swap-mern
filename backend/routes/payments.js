const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createPayment,
  getPaymentsForMatch,
  updatePaymentStatus,
  approvePayment,
  rejectPayment,
  listPendingPayments,
  getTotalEarnings
} = require('../controllers/paymentController');

router.post('/', auth(), createPayment);
router.get('/earnings', auth(['admin']), getTotalEarnings);
router.get('/pending', auth(['admin']), listPendingPayments);
router.get('/:matchId', auth(['admin']), getPaymentsForMatch);
router.put('/:paymentId/status', auth(['admin']), updatePaymentStatus);
router.put('/:paymentId/approve', auth(['admin']), approvePayment);
router.put('/:paymentId/reject', auth(['admin']), rejectPayment);

module.exports = router;