import type { VenueBox } from "@/components/map/types";

export type BoxPayment = {
  id: string;
  amount: number;
  totalAmount: number;
  date: string;
  reference: string | null;
  receiptUrl: string | null;
  registeredBy: string;
  cancelled: boolean;
  cancellationReason: string | null;
};

export type BoxDetailData = {
  box: VenueBox;
  buyer: {
    name: string;
    document: string;
    phone: string;
    recommendedBy: string | null;
    otherBoxNumbers: number[];
  } | null;
  payments: BoxPayment[];
};
