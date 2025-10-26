const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint: Get all shipments
app.get('/api/shipments', (req, res) => {
  const data = fs.readFileSync('./data/shipments.json', 'utf8');
  res.json(JSON.parse(data));
});

// Endpoint: Add a new shipment
app.post('/api/shipments', (req, res) => {
  const shipments = JSON.parse(fs.readFileSync('./data/shipments.json', 'utf8'));
  shipments.push(req.body);
  fs.writeFileSync('./data/shipments.json', JSON.stringify(shipments, null, 2));
  res.status(201).json({ message: 'Shipment added successfully' });
});

// --- INVENTORY ---
app.get('/api/inventory', (req, res) => {
  const data = fs.readFileSync('./data/inventory.json', 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/inventory', (req, res) => {
  const items = JSON.parse(fs.readFileSync('./data/inventory.json', 'utf8'));
  items.push(req.body);
  fs.writeFileSync('./data/inventory.json', JSON.stringify(items, null, 2));
  res.status(201).json({ message: 'Inventory item added successfully' });
});

// --- SUPPLIERS ---
app.get('/api/suppliers', (req, res) => {
  const data = fs.readFileSync('./data/suppliers.json', 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/suppliers', (req, res) => {
  const suppliers = JSON.parse(fs.readFileSync('./data/suppliers.json', 'utf8'));
  suppliers.push(req.body);
  fs.writeFileSync('./data/suppliers.json', JSON.stringify(suppliers, null, 2));
  res.status(201).json({ message: 'Supplier added successfully' });
});

// --- CLIENTS ---
app.get('/api/clients', (req, res) => {
  const data = fs.readFileSync('./data/clients.json', 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/clients', (req, res) => {
  const clients = JSON.parse(fs.readFileSync('./data/clients.json', 'utf8'));
  clients.push(req.body);
  fs.writeFileSync('./data/clients.json', JSON.stringify(clients, null, 2));
  res.status(201).json({ message: 'Client added successfully' });
});

// --- REPORTS ---
app.get('/api/reports/summary', (req, res) => {
  const shipments = JSON.parse(fs.readFileSync('./data/shipments.json', 'utf8'));
  const inventory = JSON.parse(fs.readFileSync('./data/inventory.json', 'utf8'));
  const suppliers = JSON.parse(fs.readFileSync('./data/suppliers.json', 'utf8'));
  const clients = JSON.parse(fs.readFileSync('./data/clients.json', 'utf8'));

  const summary = {
    totalShipments: shipments.length,
    totalDelivered: shipments.filter(s => s.status === 'Delivered').length,
    totalInventoryItems: inventory.length,
    totalSuppliers: suppliers.length,
    totalClients: clients.length,
  };

  res.json(summary);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
