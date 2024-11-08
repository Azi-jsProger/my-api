const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  name: {
    type: String,
    required: true  // исправлено с require на required
  },
  author: String,
  price: {
    type: Number,
    required: true  // исправлено с require на required
  },
  description: String
}, {
  timestamps: true  // добавление временных меток
});

module.exports = mongoose.model('Book', bookSchema);
