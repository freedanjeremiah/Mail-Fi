const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Get all contacts
router.get('/', contactController.getAllContacts.bind(contactController));

// Get contact by ID
router.get('/:id', contactController.getContactById.bind(contactController));

// Create new contact
router.post('/', contactController.createContact.bind(contactController));

// Update contact
router.put('/:id', contactController.updateContact.bind(contactController));

// Delete contact
router.delete('/:id', contactController.deleteContact.bind(contactController));

// Get contact by wallet address
router.get('/wallet/:walletAddress', contactController.getContactByWallet.bind(contactController));

module.exports = router;
