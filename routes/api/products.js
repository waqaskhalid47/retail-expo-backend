const express = require("express");
let router = express.Router();
const validateProduct = require("../../middlewares/validateProduct");
var { Product } = require("../../models/product");
const auth = require("../../middlewares/auth");
const admin = require("../../middlewares/admin");
const stripe = require("stripe")(
  "sk_test_51HDP2NBMxSYd2wLsJf8QSUuyMbKQWRcQcoJ54jClkRaafmOZUiemCdYLvhUBQhQBx8zU0HqPZ4NxiQ4rE74i2a4s002iOjT4Mh"
);
const { v4: uuidv4 } = require("uuid");

async function getAllProducts(req, res) {
  let page = Number(req.query.page ? req.query.page : 1);
  let perPage = Number(req.query.perPage ? req.query.perPage : 20);
  let skipRecords = perPage * (page - 1);
  let products = await Product.find().skip(skipRecords).limit(perPage);
  return res.send(products);
}

router.get("/", getAllProducts);

router.get("/:id", async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product)
      return res.status(400).send("Product With given ID is not present"); //when id is not present id db
    return res.send(product); //everything is ok
  } catch (err) {
    return res.status(400).send("Invalid ID"); // format of id is not correct
  }
});

router.put("/:id", auth, admin, validateProduct, async (req, res) => {
  let product = await Product.findById(req.params.id);
  product.title = req.body.title;
  product.price = req.body.price;
  product.category = req.body.category;

  product.description = req.body.description;

  product.inStock = req.body.inStock;
  product.productImage = req.body.productImage;
  await product.save();
  return res.send(product);
});

router.delete("/:id", auth, admin, async (req, res) => {
  let product = await Product.findByIdAndDelete(req.params.id);
  return res.send(product);
});

router.post("/", auth, admin, validateProduct, async (req, res) => {
  let product = new Product();
  product.title = req.body.title;
  product.price = req.body.price;
  product.category = req.body.category;
  product.description = req.body.description;
  product.inStock = req.body.inStock;
  product.productImage = req.body.productImage;
  await product.save();
  return res.send(product);
});

router.post("/checkout", async (req, res) => {
  let error;
  let status;
  try {
    const { token, total } = req.body;

    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const idempotency_key = uuidv4();
    const charge = await stripe.charges.create(
      {
        amount: total,
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        description: "Transaction Successfull!",
        shipping: {
          name: token.card.name,
          address: {
            line1: token.card.address_line1,
            line2: token.card.address_line2,
            city: token.card.address_city,
            country: token.card.address_country,
            postal_code: token.card.address_zip,
          },
        },
      },
      {
        idempotency_key,
      }
    );
    console.log("Charge:", { charge });
    status = "success";
  } catch (error) {
    console.error("Error:", error);
    status = "failure";
  }

  res.json({ error, status });
});

module.exports = router;
