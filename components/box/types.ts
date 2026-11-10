import type { VenueBox } from "@/components/map/types";
import type { AllocationSale } from "@/components/forms/allocation-editor";
import type { BuyerOption } from "@/components/forms/reserve-form";

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
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    document: string | null;
    phone: string;
    recommendedBy: string | null;
    otherBoxNumbers: number[];
  } | null;
  payments: BoxPayment[];
  activeSales: AllocationSale[];
  reserveBuyers: BuyerOption[];
  recommendations: string[];
};
