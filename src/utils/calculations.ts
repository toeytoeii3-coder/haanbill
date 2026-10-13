import {
  Member,
  BillItem,
  BillSettings,
  BillCalculationResult,
  PersonBreakdown,
  UserBalance,
  SettlementTransfer,
} from '../types/bill';

export function calculateBill(
  members: Member[],
  items: BillItem[],
  settings: BillSettings
): BillCalculationResult {
  if (members.length === 0) {
    return {
      rawSubtotal: 0,
      foodSubtotal: 0,
      alcoholSubtotal: 0,
      communalSubtotal: 0,
      customSubtotal: 0,
      discountAmount: 0,
      netSubtotal: 0,
      serviceChargeAmount: 0,
      vatAmount: 0,
      grandTotal: 0,
      breakdowns: [],
      userBalances: [],
      settlements: [],
      multiplePayersActive: false,
    };
  }

  let foodSubtotal = 0;
  let alcoholSubtotal = 0;
  let communalSubtotal = 0;
  let customSubtotal = 0;

  // Track raw person item allocations
  const personAllocations: Record<
    string,
    {
      food: number;
      alcohol: number;
      communal: number;
      custom: number;
      subtotal: number;
      details: { itemName: string; category: BillItem['category']; cost: number; splitWithCount: number }[];
    }
  > = {};

  // Track upfront payments per member
  const upfrontPaidMap: Record<string, number> = {};

  for (const m of members) {
    personAllocations[m.id] = {
      food: 0,
      alcohol: 0,
      communal: 0,
      custom: 0,
      subtotal: 0,
      details: [],
    };
    upfrontPaidMap[m.id] = 0;
  }

  const defaultPayerId = members[0]?.id;

  for (const item of items) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    if (itemTotal <= 0) continue;

    // Attribute payment to designated payer
    const payerId = item.paidByMemberId && members.some((m) => m.id === item.paidByMemberId)
      ? item.paidByMemberId
      : defaultPayerId;
    if (payerId && upfrontPaidMap[payerId] !== undefined) {
      upfrontPaidMap[payerId] += itemTotal;
    }

    // Track category subtotals
    if (item.category === 'alcohol') alcoholSubtotal += itemTotal;
    else if (item.category === 'food') foodSubtotal += itemTotal;
    else if (item.category === 'communal') communalSubtotal += itemTotal;
    else customSubtotal += itemTotal;

    // Determine eligible assignees
    const validAssignees = item.assignedMemberIds.filter((id) =>
      members.some((m) => m.id === id)
    );

    if (validAssignees.length === 0) {
      const splitAmount = itemTotal / members.length;
      for (const m of members) {
        personAllocations[m.id].subtotal += splitAmount;
        if (item.category === 'alcohol') personAllocations[m.id].alcohol += splitAmount;
        else if (item.category === 'food') personAllocations[m.id].food += splitAmount;
        else if (item.category === 'communal') personAllocations[m.id].communal += splitAmount;
        else personAllocations[m.id].custom += splitAmount;

        personAllocations[m.id].details.push({
          itemName: item.name,
          category: item.category,
          cost: splitAmount,
          splitWithCount: members.length,
        });
      }
    } else {
      const splitAmount = itemTotal / validAssignees.length;
      for (const memberId of validAssignees) {
        personAllocations[memberId].subtotal += splitAmount;
        if (item.category === 'alcohol') personAllocations[memberId].alcohol += splitAmount;
        else if (item.category === 'food') personAllocations[memberId].food += splitAmount;
        else if (item.category === 'communal') personAllocations[memberId].communal += splitAmount;
        else personAllocations[memberId].custom += splitAmount;

        personAllocations[memberId].details.push({
          itemName: item.name,
          category: item.category,
          cost: splitAmount,
          splitWithCount: validAssignees.length,
        });
      }
    }
  }

  const rawSubtotal = foodSubtotal + alcoholSubtotal + communalSubtotal + customSubtotal;

  // Calculate discount
  let discountAmount = 0;
  if (settings.discountType === 'percentage') {
    discountAmount = (rawSubtotal * (settings.discountValue || 0)) / 100;
  } else {
    discountAmount = Math.min(settings.discountValue || 0, rawSubtotal);
  }
  discountAmount = Math.max(0, discountAmount);

  const netSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const serviceChargeAmount = (netSubtotal * (settings.serviceChargeRate || 0)) / 100;
  const taxableAmount = netSubtotal + serviceChargeAmount;
  const vatAmount = (taxableAmount * (settings.vatRate || 0)) / 100;
  const rawGrandTotal = taxableAmount + vatAmount;

  // Multiplier for tax and discount
  const ratio = rawSubtotal > 0 ? rawGrandTotal / rawSubtotal : 0;

  // Build breakdowns
  const breakdowns: PersonBreakdown[] = members.map((member) => {
    const alloc = personAllocations[member.id];
    const personRawSubtotal = alloc.subtotal;
    const proportion = rawSubtotal > 0 ? personRawSubtotal / rawSubtotal : 0;

    const personDiscount = discountAmount * proportion;
    const personNet = Math.max(0, personRawSubtotal - personDiscount);
    const personServiceCharge = (personNet * (settings.serviceChargeRate || 0)) / 100;
    const personVAT = ((personNet + personServiceCharge) * (settings.vatRate || 0)) / 100;
    const calculatedTotal = personRawSubtotal * ratio;

    let finalPersonTotal = calculatedTotal;
    if (settings.roundingMode === 'roundUp') {
      finalPersonTotal = Math.ceil(calculatedTotal);
    } else if (settings.roundingMode === 'roundHalf') {
      finalPersonTotal = Math.round(calculatedTotal);
    } else {
      finalPersonTotal = Math.round(calculatedTotal * 100) / 100;
    }

    return {
      member,
      foodShare: Math.round(alloc.food * 100) / 100,
      alcoholShare: Math.round(alloc.alcohol * 100) / 100,
      communalShare: Math.round(alloc.communal * 100) / 100,
      customShare: Math.round(alloc.custom * 100) / 100,
      subtotal: Math.round(personRawSubtotal * 100) / 100,
      discountShare: Math.round(personDiscount * 100) / 100,
      serviceChargeShare: Math.round(personServiceCharge * 100) / 100,
      vatShare: Math.round(personVAT * 100) / 100,
      total: finalPersonTotal,
      itemDetails: alloc.details,
    };
  });

  // Calculate upfront paid adjusted for tax/discount proportionally
  // If someone paid raw subtotal X, their paid share with tax/discount = X * ratio
  const userBalances: UserBalance[] = members.map((member) => {
    const rawPaid = upfrontPaidMap[member.id] || 0;
    const adjustedPaid = Math.round(rawPaid * ratio * 100) / 100;
    const breakdown = breakdowns.find((b) => b.member.id === member.id);
    const fairShare = breakdown ? breakdown.total : 0;
    const netBalance = Math.round((adjustedPaid - fairShare) * 100) / 100;

    return {
      member,
      totalPaid: adjustedPaid,
      fairShare,
      netBalance,
    };
  });

  // Check if multiple users paid
  const payersCount = userBalances.filter((u) => u.totalPaid > 0).length;
  const multiplePayersActive = payersCount > 1;

  // Calculate minimum transaction debt settlements
  const creditors: { member: Member; balance: number }[] = [];
  const debtors: { member: Member; balance: number }[] = [];

  userBalances.forEach((u) => {
    if (u.netBalance > 0.01) {
      creditors.push({ member: u.member, balance: u.netBalance });
    } else if (u.netBalance < -0.01) {
      debtors.push({ member: u.member, balance: -u.netBalance });
    }
  });

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  const settlements: SettlementTransfer[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const cred = creditors[cIdx];
    const deb = debtors[dIdx];

    const transferAmount = Math.min(cred.balance, deb.balance);
    if (transferAmount > 0.01) {
      settlements.push({
        fromMember: deb.member,
        toMember: cred.member,
        amount: Math.round(transferAmount * 100) / 100,
      });

      cred.balance -= transferAmount;
      deb.balance -= transferAmount;
    }

    if (cred.balance <= 0.01) cIdx++;
    if (deb.balance <= 0.01) dIdx++;
  }

  return {
    rawSubtotal: Math.round(rawSubtotal * 100) / 100,
    foodSubtotal: Math.round(foodSubtotal * 100) / 100,
    alcoholSubtotal: Math.round(alcoholSubtotal * 100) / 100,
    communalSubtotal: Math.round(communalSubtotal * 100) / 100,
    customSubtotal: Math.round(customSubtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    netSubtotal: Math.round(netSubtotal * 100) / 100,
    serviceChargeAmount: Math.round(serviceChargeAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grandTotal: Math.round(rawGrandTotal * 100) / 100,
    breakdowns,
    userBalances,
    settlements,
    multiplePayersActive,
  };
}
