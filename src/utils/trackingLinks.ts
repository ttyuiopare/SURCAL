export type CarrierKey = 'usps' | 'ups' | 'fedex' | 'dhl' | 'ontrac' | 'other';

export const CARRIERS: { key: CarrierKey; label: string }[] = [
  { key: 'usps', label: 'USPS' },
  { key: 'ups', label: 'UPS' },
  { key: 'fedex', label: 'FedEx' },
  { key: 'dhl', label: 'DHL' },
  { key: 'ontrac', label: 'OnTrac' },
  { key: 'other', label: 'Other' },
];

export function normalizeCarrier(carrier: string | null | undefined): CarrierKey {
  if (!carrier) return 'other';
  const c = carrier.toLowerCase();
  if (c.includes('usps') || c.includes('postal')) return 'usps';
  if (c.includes('ups')) return 'ups';
  if (c.includes('fedex') || c.includes('fed ex')) return 'fedex';
  if (c.includes('dhl')) return 'dhl';
  if (c.includes('ontrac')) return 'ontrac';
  return 'other';
}

export function carrierLabel(carrier: string | null | undefined): string {
  const key = normalizeCarrier(carrier);
  return CARRIERS.find(c => c.key === key)?.label ?? (carrier || 'Carrier');
}

export function trackingUrl(
  carrier: string | null | undefined,
  number: string | null | undefined
): string | null {
  if (!number) return null;
  const n = encodeURIComponent(number.trim());
  switch (normalizeCarrier(carrier)) {
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
    case 'ups':
      return `https://www.ups.com/track?tracknum=${n}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
    case 'dhl':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${n}`;
    case 'ontrac':
      return `https://www.ontrac.com/tracking/?number=${n}`;
    default:
      return null;
  }
}

export type FulfillmentStage = 'accepted' | 'escrow' | 'shipped' | 'delivered';

export function stageFromTransaction(tx: {
  status?: string | null;
  tracking_number?: string | null;
} | null | undefined): FulfillmentStage {
  if (!tx) return 'accepted';
  if (tx.status === 'released') return 'delivered';
  if (tx.status === 'shipped' || tx.tracking_number) return 'shipped';
  return 'escrow';
}

export const STAGE_INDEX: Record<FulfillmentStage, number> = {
  accepted: 0,
  escrow: 1,
  shipped: 2,
  delivered: 3,
};
