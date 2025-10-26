const contactModel = require('../models/contact');

class ContactController {
  // Get all contacts
  getAllContacts(req, res) {
    try {
      const contacts = contactModel.findAll();
      res.json({
        success: true,
        data: contacts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get contact by ID
  getContactById(req, res) {
    try {
      const { id } = req.params;
      const contact = contactModel.findById(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new contact
  createContact(req, res) {
    try {
      const { name, email, walletAddress } = req.body;

      // Validation
      if (!name || !email || !walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and wallet address are required'
        });
      }

      // Check if email already exists
      const existingEmail = contactModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Contact with this email already exists'
        });
      }

      // Check if wallet address already exists
      const existingWallet = contactModel.findByWalletAddress(walletAddress);
      if (existingWallet) {
        return res.status(400).json({
          success: false,
          error: 'Contact with this wallet address already exists'
        });
      }

      const contact = contactModel.create({ name, email, walletAddress });

      res.status(201).json({
        success: true,
        data: contact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update contact
  updateContact(req, res) {
    try {
      const { id } = req.params;
      const { name, email, walletAddress } = req.body;

      const contact = contactModel.findById(id);
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      // Check if new email conflicts with another contact
      if (email && email !== contact.email) {
        const existingEmail = contactModel.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            error: 'Another contact with this email already exists'
          });
        }
      }

      // Check if new wallet address conflicts with another contact
      if (walletAddress && walletAddress !== contact.walletAddress) {
        const existingWallet = contactModel.findByWalletAddress(walletAddress);
        if (existingWallet) {
          return res.status(400).json({
            success: false,
            error: 'Another contact with this wallet address already exists'
          });
        }
      }

      const updatedContact = contactModel.update(id, { name, email, walletAddress });

      res.json({
        success: true,
        data: updatedContact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete contact
  deleteContact(req, res) {
    try {
      const { id } = req.params;

      const success = contactModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.json({
        success: true,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Find contact by wallet address
  getContactByWallet(req, res) {
    try {
      const { walletAddress } = req.params;
      const contact = contactModel.findByWalletAddress(walletAddress);

      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ContactController();
