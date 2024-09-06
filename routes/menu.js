const express = require('express');
const router = express.Router();
const MenuItem = require('../model/Items');

// Index - List all menu items
router.get('/', async (req, res) => {
  const menuItems = await MenuItem.find({});
  res.render('Menu/index', { menuItems });
});

// Edit - Edit menu item form
router.get('/:id/edit', async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  res.render('Menu/edit', { menuItem });
});

// Update - Update menu item
router.put('/:id', async (req, res) => {
  await MenuItem.findByIdAndUpdate(req.params.id, req.body.menuItem);
  res.redirect('/menu');
});

// Create - Add new menu item
router.post('/', async (req, res) => {
  const newItem = new MenuItem(req.body.menuItem);
  await newItem.save();
  res.redirect('/menu');
});

// Delete - Remove a menu item
router.delete('/:id', async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.redirect('/menu');
});

router.get('/new', (req, res) => {
    res.render('Menu/new');
});

module.exports = router;