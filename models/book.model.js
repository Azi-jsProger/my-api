const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    author: String,
    price: {
      type: Number,
      required: true,
    },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
