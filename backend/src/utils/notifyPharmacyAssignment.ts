import Notification from '../models/notification.model';

/**
 * Create a pharmacy assignment notification for the assigned pharmacy.
 * @param pharmacyId - The ObjectId of the assigned pharmacy (user)
 * @param patient - The patient object (should have firstName, lastName)
 * @param prescriptionId - The prescription ObjectId
 */
export async function notifyPharmacyAssignment(pharmacyId: string, patient: { firstName: string, lastName: string }, prescriptionId: string) {
  const title = 'You have been assigned a new prescription request';
  const message = `A patient (${patient.firstName} ${patient.lastName}) has been assigned to your pharmacy for prescription fulfillment. Please review the medication details and proceed with the fulfillment process.`;
  const actionUrl = `/dashboard/pharmacy/prescriptions/${prescriptionId}`;
  const notificationPayload = {
    userId: pharmacyId,
    type: 'pharmacy_assignment',
    title,
    message,
    priority: 'medium',
    isRead: false,
    actionUrl,
    relatedEntity: { type: 'prescription', id: prescriptionId },
  };
  console.log('[notifyPharmacyAssignment] Creating notification:', {
    pharmacyId,
    patient,
    prescriptionId,
    notificationPayload
  });
  try {
    const result = await Notification.create(notificationPayload);
    console.log('[notifyPharmacyAssignment] Notification created successfully:', result);
  } catch (err) {
    console.error('[notifyPharmacyAssignment] Notification creation error:', err);
  }
}
