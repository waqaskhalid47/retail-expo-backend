var mongoose = require("mongoose");
const Joi = require("@hapi/joi");
var productSchema = mongoose.Schema({
  title: String,
  description: String,
  inStock: Number,
  category: String,
  price: Number,
  productImage: String,
});
var Product = mongoose.model("Product", productSchema);

function validateProduct(data) {
  const schema = Joi.object({
    price: Joi.number().min(0).required(),
    title: Joi.string().min(3).max(100).required(),
    inStock: Joi.number().min(0).required(),
    description: Joi.string().min(3).max(1000).required(),
    category: Joi.string().min(3).max(20).required(),
    productImage: Joi.string().min(3).max(1000).required(),
  });
  return schema.validate(data, { abortEarly: false });
}
module.exports.Product = Product;
module.exports.validate = validateProduct;
