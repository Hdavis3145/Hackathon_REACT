import type { Medication } from "@shared/schema";

export interface RefillStatus {
  needsRefill: boolean;
  urgent: boolean;
  pillsRemaining: number;
  daysRemaining: number;
  message: string;
}

export function calculateRefillStatus(medication: Medication): RefillStatus {
  const pillsRemaining = medication.pillsRemaining ?? 30;
  const refillThreshold = medication.refillThreshold ?? 7;
  const dailyDoses = medication.times.length;
  
  // Calculate days remaining based on daily usage
  const daysRemaining = dailyDoses > 0 
    ? Math.floor(pillsRemaining / dailyDoses)
    : 30;

  const needsRefill = pillsRemaining <= refillThreshold;
  const urgent = daysRemaining <= 3;

  let message = "";
  if (urgent && daysRemaining <= 0) {
    message = "Out of stock - Refill now!";
  } else if (urgent) {
    message = `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`;
  } else if (needsRefill) {
    message = `${pillsRemaining} pills remaining`;
  } else {
    message = `${pillsRemaining} pills in stock`;
  }

  return {
    needsRefill,
    urgent,
    pillsRemaining,
    daysRemaining,
    message,
  };
}

export function getMedicationsNeedingRefill(medications: Medication[]): Medication[] {
  return medications.filter(med => {
    const status = calculateRefillStatus(med);
    return status.needsRefill;
  });
}
