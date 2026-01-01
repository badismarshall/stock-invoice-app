"use server";

// Re-export actions from the main cancellation module as async wrappers
// The actions are generic and work for both local and export
// We just need to pass noteType: "export" when calling getClientDeliveryNoteItemsAction

import {
  getClientDeliveryNoteItemsAction as _getClientDeliveryNoteItemsAction,
  createPartialDeliveryNoteCancellation as _createPartialDeliveryNoteCancellation,
  getAllClients as _getAllClients,
  getDeliveryNoteCancellationByIdAction as _getDeliveryNoteCancellationByIdAction,
  updateDeliveryNoteCancellation as _updateDeliveryNoteCancellation,
  getCancellationItemsForDelete as _getCancellationItemsForDelete,
  deleteCancellationItem as _deleteCancellationItem,
  deleteDeliveryNoteCancellation as _deleteDeliveryNoteCancellation,
  deleteDeliveryNoteCancellations as _deleteDeliveryNoteCancellations,
} from "@/app/(root)/dashboard/delivery-notes-cancellation/_lib/actions";

export async function getClientDeliveryNoteItemsAction(input: { clientId: string; noteType?: "local" | "export" }) {
  return _getClientDeliveryNoteItemsAction(input);
}

export async function createPartialDeliveryNoteCancellation(input: {
  clientId: string;
  cancellationDate: Date;
  reason?: string;
  items: Array<{
    deliveryNoteItemId: string;
    quantity: number;
  }>;
}) {
  return _createPartialDeliveryNoteCancellation(input);
}

export async function getAllClients() {
  return _getAllClients();
}

export async function getDeliveryNoteCancellationByIdAction(input: { id: string }) {
  return _getDeliveryNoteCancellationByIdAction(input);
}

export async function updateDeliveryNoteCancellation(input: {
  id: string;
  cancellationDate: Date;
  reason?: string;
  items: Array<{
    cancellationItemId: string;
    deliveryNoteItemId: string;
    quantity: number;
  }>;
}) {
  return _updateDeliveryNoteCancellation(input);
}

export async function getCancellationItemsForDelete(input: { id: string }) {
  return _getCancellationItemsForDelete(input);
}

export async function deleteCancellationItem(input: {
  cancellationId: string;
  itemId: string;
  productId: string;
  quantity: number;
}) {
  return _deleteCancellationItem(input);
}

export async function deleteDeliveryNoteCancellation(input: { id: string }) {
  return _deleteDeliveryNoteCancellation(input);
}

export async function deleteDeliveryNoteCancellations(input: { ids: string[] }) {
  return _deleteDeliveryNoteCancellations(input);
}
