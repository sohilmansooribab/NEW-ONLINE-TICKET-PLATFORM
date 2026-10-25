
export const calculateAuthoritativePricing = (showtime, screen, seatIds, promoCode = null) => {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error('At least one seat identifier is required for price calculation');
  }

  const screenSeatsMap = new Map();
  for (const s of screen.seats) {
    screenSeatsMap.set(s.seatId.toUpperCase(), s);
  }

  const seatDetails = [];
  let baseAmount = 0;

  for (const id of seatIds) {
    const uppercaseId = id.toUpperCase().trim();
    const screenSeat = screenSeatsMap.get(uppercaseId);

    if (!screenSeat) {
      throw new Error(`Invalid seat identifier '${id}': seat does not exist on this screen`);
    }

    if (!screenSeat.isActive) {
      throw new Error(`Seat '${id}' is currently marked out-of-order / inactive`);
    }

    const tier = screenSeat.tier;
    const unitPrice =
      showtime.tierPricing?.[tier] !== undefined
        ? showtime.tierPricing[tier]
        : tier === 'VIP Recliner'
        ? 520
        : tier === 'Premium'
        ? 380
        : 280;

    baseAmount += unitPrice;
    seatDetails.push({
      seatId: uppercaseId,
      row: screenSeat.row,
      number: screenSeat.number,
      tier,
      unitPrice,
    });
  }

  const convenienceFee = Math.round(baseAmount * 0.12);

  let discountAmount = 0;
  if (promoCode && typeof promoCode === 'string') {
    const normalizedCode = promoCode.trim().toUpperCase();
    if (normalizedCode === 'CINEPASS20') {
      discountAmount = Math.min(150, Math.round((baseAmount * 20) / 100));
    } else if (normalizedCode === 'FLAT100' && baseAmount >= 500) {
      discountAmount = 100;
    }
  }

  const totalAmount = Math.max(0, baseAmount + convenienceFee - discountAmount);

  return {
    seatDetails,
    pricing: {
      baseAmount,
      convenienceFee,
      discountAmount,
      totalAmount,
    },
  };
};
