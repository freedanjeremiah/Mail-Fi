// In-memory storage for contacts (you can replace with a database)
class ContactModel {
  constructor() {
    this.contacts = [];
    this.nextId = 1;
  }

  // Create a new contact
  create(contactData) {
    const contact = {
      id: this.nextId++,
      name: contactData.name,
      email: contactData.email,
      walletAddress: contactData.walletAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.contacts.push(contact);
    return contact;
  }

  // Get all contacts
  findAll() {
    return this.contacts;
  }

  // Find contact by ID
  findById(id) {
    return this.contacts.find(contact => contact.id === parseInt(id));
  }

  // Find contact by wallet address
  findByWalletAddress(walletAddress) {
    return this.contacts.find(contact => contact.walletAddress === walletAddress);
  }

  // Find contact by email
  findByEmail(email) {
    return this.contacts.find(contact => contact.email === email);
  }

  // Update contact
  update(id, updateData) {
    const index = this.contacts.findIndex(contact => contact.id === parseInt(id));

    if (index === -1) {
      return null;
    }

    this.contacts[index] = {
      ...this.contacts[index],
      ...updateData,
      id: this.contacts[index].id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    return this.contacts[index];
  }

  // Delete contact
  delete(id) {
    const index = this.contacts.findIndex(contact => contact.id === parseInt(id));

    if (index === -1) {
      return false;
    }

    this.contacts.splice(index, 1);
    return true;
  }
}

// Export a singleton instance
module.exports = new ContactModel();
