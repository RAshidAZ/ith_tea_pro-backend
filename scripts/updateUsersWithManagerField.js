require('../config/index');
const mongoose = require('mongoose');
const users = require('../models/users');

// Define the new key and its value
const newKey = 'managerIds';
const newValue = mongoose.Types.ObjectId();

// Use the updateMany function to update multiple documents
users.updateMany({ managerIds: {$exists:false} }, { $set: { [newKey]: [newValue] } }, (err, result) => {
  if (err) {
    console.error('Error updating documents:', err);
  } else {
    console.log('Documents updated successfully:', result);
  }
}); 