// Compatibility matrix for transfusion (simple donor -> recipient rule)
// Returns compatible recipient blood groups for a given donor group.

const compatibleRecipientByDonor = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

function getCompatibleRecipients(donorBloodGroup) {
  return compatibleRecipientByDonor[donorBloodGroup] || [];
}

function isCompatible(donorBloodGroup, recipientBloodGroup) {
  return getCompatibleRecipients(donorBloodGroup).includes(recipientBloodGroup);
}

module.exports = { getCompatibleRecipients, isCompatible };

