type ResettableMutation = {
  reset: () => void
}

export function resetLeadSaveMutations(
  createLead: ResettableMutation,
  updateLead: ResettableMutation,
) {
  createLead.reset()
  updateLead.reset()
}
