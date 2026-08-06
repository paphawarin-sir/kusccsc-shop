const mongoose = require("mongoose");

const RecSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    imageUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rec", RecSchema);