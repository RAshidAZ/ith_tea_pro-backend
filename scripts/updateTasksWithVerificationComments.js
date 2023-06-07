require('../config/index');
const mongoose = require('mongoose');
const Tasks = require('../models/tasks');

// Define the new key and its value
const newKey = 'verificationComments';
const newValue = mongoose.Types.ObjectId();

// Use the updateMany function to update multiple documents
Tasks.updateMany({verificationComments:{$exists:false}}, { $set: { [newKey]: [newValue] } }, (err, result) => {
  if (err) {
    console.error('Error updating documents:', err);
  } else {
    console.log('Documents updated successfully:', result);
  }
}); 