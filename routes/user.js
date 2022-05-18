
let express = require("express");
let router = express.Router();
//  const otpauth = require("../config/otpauth");
 require('dotenv').config()
 const accountSID = process.env.accountSID;
const authToken = process.env.authToken;
const serviceSID = process.env.serviceSID;
const client = require("twilio")(accountSID, authToken);
const paypal = require("paypal-rest-sdk");
const createReferal = require("referral-code-generator")
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const { response } = require("express");
//const { response } = require("express");
/* GET home page. */
const verifyLogin = (req, res, next) => {
  console.log("Verify login called");
  if (req.session.user) {
    userHelpers.verify(req.session.user._id).then((user)=>{
      if(user.status == "unblock"){
        next();
      }else{
        req.session.user=null;
        res.redirect("/message")
      }
    })
    
  } else {
    res.redirect("/login");
  }
};

paypal.configure({
  mode: "sandbox", 
  client_id: process.env.client_id,
  client_secret: process.env.client_secret
 });

router.get("/", (req, res, next) => {
  let today=new Date()
  let categories = productHelpers.getAllCategories();
  productHelpers.getAllproducts().then(async (products) => {
    productHelpers.startProductOffer(today)
    productHelpers.startCategoryOffer(today)
    let cartCount = null;
    
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    if (req.session.loggedIn) {
      let user = req.session.user;
      let categories = await productHelpers.getAllCategories();
      let output = await userHelpers.getWhish(user?._id);
      
       let filteredProducts = await productHelpers.handleWishlist(output,products);
       products = filteredProducts 
       res.render("user/index", {products,user,categories,cartCount,output,admin: false,});
     } 
     else {
      console.log("else case")
      res.render("user/index", { products, categories, admin: false });
    }
  });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.userLoginErr });
  }
  req.session.userLoginErr = false;
});

router.get("/loginotp", async (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/loginotp", { noUser: req.session.noUserMobile });
    req.session.noUserMobile = false;
  }
});

router.post("/loginotp", (req, res) => {
  let No = req.body.mobileNo;
  let no = `+91${No}`;
  console.log(no);
  console.log("response", req.body);
  userHelpers.getUserdetails(no).then((user) => {
    if (user) {
      if (user.status === "unblock") {
        console.log(user.status);
        client.verify
          .services(serviceSID)
          .verifications.create({
            to: `+91${No}`,
            channel: "sms",
          })
          .then((resp) => {
            req.session.number = resp.to;
            console.log(resp);
            res.redirect("/login/otp");
            //res.redirect('/loginotp')
          });
      } else {
        res.redirect("/message");
      }
    } else {
      req.session.noUserMobile = true;
      res.redirect("/loginotp");
    }
  });
});

router.get("/login/otp", async (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/user-otp", {
      otp: true,
      invalidOtp: req.session.invalidOtp,
    });
    req.session.invalidOtp = false;
  }
});

router.post("/login/otp", (req, res) => {
  const otp = req.body.otp;
  console.log(otp);
  number = req.session.number;
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: number,
      code: otp,
    })
    .then((response) => {
      if (response.valid) {
        userHelpers.getUserdetails(number).then(async (user) => {
          req.session.loggedIn = true;
          req.session.user = user;
          res.redirect("/");
        });
      } else {
        console.log("error");
        req.session.invalidOtp = true;
        res.redirect("/login/otp");
      }
    });
});

router.get("/login/resend-otp", (req, res) => {
  let number = req.session.number;

  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `${number}`,
      channel: "sms",
    })
    .then((resp) => {
      req.session.number = resp.to;
      console.log(resp);
      res.redirect("/login/otp");
    });
});
router.get("/signup",  (req, res) => {
  let refer = (req.query.refer) ? req.query.refer : null;
  res.render("user/signup", {refer, referErr: req.session.referalErr});
  req.session.referalErr = false;
});
router.get("/message", (req, res) => {
  res.render("user/message");
});

router.post("/signup", (req, res) => {
  let refer = createReferal.alphaNumeric("uppercase", 2, 3)
  req.body.refer = refer;
  if(req.body.referedBy != ""){
    userHelpers.checkReferal(req.body.referedBy).then((data)=>{
      req.body.referedBy = data[0]._id;
      req.body.wallet = 100;
      console.log("req.body.signup",req.body);
      userHelpers.doSignup(req.body).then(async(response) => {
        console.log("walletsignup",response);
       await userHelpers.addWallet(req.body.wallet, response);
        res.redirect("/login");
      })
    }).catch(() => {
      req.session.referalErr = true;
      res.redirect("/signup");
    })
  }else{
    userHelpers.doSignup(req.body).then((response) => {     
      res.redirect("/login")
    }).catch(() => {
      res.redirect("/signup");
    })
  }
});
router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.user.status === "unblock") {
        req.session.loggedIn = true;
        req.session.user = response.user;
        let ser = response.user.status;
        console.log(ser);
        res.redirect("/");
      } else {
        res.redirect("/message");
      }
    } else {
      req.session.userLoginErr = true;
      res.redirect("/login");
    }
  });
});

router.get("/catdetails/:category", verifyLogin, function (req, res) {
  let category = req.params.category;
  let user = req.session.user;
  productHelpers.getCatDetails(category).then((catproducts) => {
    console.log(catproducts);
    res.render("user/catproduct", { catproducts, user });
  });
});
router.get("/productdetails/:id", verifyLogin, async function (req, res) {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  let prodetails = await productHelpers.getProductDetails(req.params.id);
  console.log(prodetails);
  res.render("user/product", { prodetails, id, user, cartCount });
});

router.get("/categories", function (req, res) {
  productHelpers.getAllCategories().then((categories) => {
    res.render("user/categories", { categories, user: true });
  });
});
router.get("/add-to-cart/:id", (req, res) => {
  console.log("api call");
  let user = req.session.user;
  userHelpers.addToCart(req.params.id, user._id).then(() => {
    res.json({ status: true });
  });
});
router.get("/remove-cart/:id", verifyLogin, (req, res) => {
  console.log("remove cart call");
  let user = req.session.user;
  userHelpers.removeCart(req.params.id, user._id).then(() => {
    res.json({ status: true });
  });
});

router.get("/add-to-whish/:id", verifyLogin, (req, res) => {
  console.log("whish call");
  let user = req.session.user;
  userHelpers.addToWhish(req.params.id, user._id).then(() => {
    res.json({ status: true });
  });
});

router.get("/remove-whish/:id", verifyLogin, (req, res) => {
  console.log("remove whish call");
  let user = req.session.user;
  userHelpers.removeWhish(req.params.id, user._id).then(() => {
    res.json({ status: true });
  });
});
router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let id = user._id;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  let products = await userHelpers.getCartProducts(user._id);
  console.log(products);
  let total = 0;
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(id);
  }
  res.render("user/cart", { products, user, cartCount, total });
});

router.get("/whish", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let id = user._id;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  let products = await userHelpers.getWhishProducts(user._id);
  
  console.log("whish items", products);

  res.render("user/whish", { products, user, cartCount });
});
router.get("/logout",  (req, res) => {
   req.session.user=null
  // req.session.destroy();
  res.redirect("/");
});
router.post("/change-product-quantity", (req, res, next) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});
router.get("/profile", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let id = user._id;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  user = await userHelpers.userProfile(id);
  let wallet = await userHelpers.getWallet(id);
  userHelpers.userAddress(id).then((address) => {
    let refer = user.refer;
    let referLink = "https://www.cozastore.shop/signup?refer=" + refer;       
    res.render("user/profile", { user, cartCount, address, wallet, referLink });
  });
});

router.post("/edit-profile/:id", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateProfile(req.params.id, req.body).then(() => {
    res.redirect("/profile");
  });
});
router.get("/change-password", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  res.render("user/password", {
    user,
    cartCount,
    samePwdErr: req.session.pwdCompareErr,
    pwdErr: req.session.currentPwdErr,
  });

  req.session.currentPwdErr = false;
  req.session.pwdCompareErr = false;
});

router.post("/change-password", verifyLogin, (req, res) => {
  console.log(req.body);
  let userId = req.session.user._id;
  let pass1 = req.body.password1;
  let pass2 = req.body.password2;
  if (pass1 == pass2) {
    userHelpers.changePassword(userId, req.body).then((response) => {
      if (response.status) {
        req.session.destroy();
        res.redirect("/login");
      } else {
        res.redirect("/change-password");
      }
      req.session.pwdCompareErr = true;
    });
  } else {
    res.redirect("/change-password");
  }
  req.session.currentPwdErr = true;
});
router.get("/add-address", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  res.render("user/address", { user, cartCount });
});

router.post("/add-address", verifyLogin, (req, res) => {
  console.log(req.body);
  let userId = req.session.user._id;
  userHelpers.addAddress(userId, req.body).then((response) => {
    res.redirect("/profile");
  });
});

router.get("/delete-address/:id", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  let addressId = req.params.id;
  console.log(addressId);
  userHelpers.deleteAddress(addressId, userId).then((response) => {
    res.redirect("/profile");
  });
});
router.get("/place-order", verifyLogin, async (req, res) => {
  let today=new Date()
  let user = req.session.user;
  let id = user._id;
  let cartCount = null;
  
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  // let coupon = await productHelpers.getAllCoupon().then()
  let total = await userHelpers.getTotalAmount(id);
  let wallet = await userHelpers.getWallet(id);

    productHelpers.startCouponOffers(today)
       let coup = await productHelpers.getAvailableCoupons()
  console.log("couponhhh",coup)
  if(coup){
       //coup = coupon;   
  console.log("final coupon", coup);
  userHelpers.userAddress(id).then((address) => {
    res.render("user/place-order", { user,  cartCount, wallet, coup, address, total });
  });
}else{
  userHelpers.userAddress(id).then((address) => {
    res.render("user/place-order", { user,  cartCount, wallet,  address, total });
  });
}

});

router.post("/place-order",  async (req, res) => {
  console.log("req.body",req.body);
  if(req.body.couponapply == "true"){
    productHelpers.addCouponUser(req.body.couponapplyid,req.body.userId)
  }
  if(req.body.walletapply == "true"){
    productHelpers.walletReduction(req.body.walletapplyamount,req.body.userId)
    console.log("walletreduction",req.body.walletapplyamount,req.body.userId)
  }
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = parseInt(req.body.total)
  console.log("tostla", totalPrice);
  let name = req.session.user.name;
  userHelpers
    .placeOrder(req.body, products, totalPrice, name)
    .then((orderId) => {
      req.session.orderId = orderId;
      console.log("oorder", orderId);
      if (req.body["payment"] == "COD") {
        res.json({ codSuccess: true });
      } else if (req.body["payment"] == "Razorpay") {
        userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json({ ...response, razorpay: true });
        });
      } else if (req.body["payment"] == "Paypal") {
        val = totalPrice / 74;
        totals = val.toFixed(2);
        let total = totals.toString();
         console.log("respi", total);
        req.session.totals = total;

        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "https://www.cozastore.shop/success",
            cancel_url: "https://www.cozastore.shop/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: "Red Sox Hat",
                    sku: "001",

                    price: total,
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: total,
              },
              description: "Hat for the best team ever",
            },
          ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            throw error;
          } else {
            console.log("create payment response");
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                console.log("success");
                let url = payment.links[i].href;
                res.json({ url });
              } else {
                console.log("err");
              }
            }
          }
        });
      }
    });
  console.log("paypal", req.body);
});

router.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let total = req.session.totals;

  let totals = total.toString();
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: totals,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        // TjRZx3$i
        // appupersonal@example.com
        userHelpers.changePaymentStatus(req.session.orderId).then(() => {
          res.redirect("/order-success");
        });
      }
    }
  );
});

router.get("/cancel", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  res.render("user/order-cancel", { user, cartCount });
});
router.get("/order-success", verifyLogin, async (req, res) => {
  let user = req.session.user;
  userHelpers.clearCart(user._id).then();
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  res.render("user/order-success", { user, cartCount });
});
router.get("/orders", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  let orders = await userHelpers.getUserOrders(user._id);
  res.render("user/orders", { user, cartCount, orders });
});
router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }
  let address = await userHelpers.orderUserAddress(req.params.id);
  let products = await userHelpers.getOrderProducts(req.params.id);
  res.render("user/view-order-products", {
    user,
    cartCount,
    products,
    address,
  });
});

router.get("/status-change", verifyLogin, (req, res) => {
  let user = req.session.user;
  let status = req.query.status;
  let id = req.query.id;
  let total = req.query.total;
  let payment = req.query.payment;
  if (status == "cancelled") {
    productHelpers.changeCancelStatus(status, id).then(() => {
      console.log("cancel");
      if (payment !== "COD") {
        userHelpers.addWallet(total, user._id);
     }
    });
  } else if (status == "return") {
    productHelpers.changeReturnStatus(status, id).then();
  } else {
    productHelpers.changeStatus(status, id).then();
  }
  res.redirect("/orders");
});
router.post("/verify-payment", (req, res) => {
  console.log(req.body);
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        console.log("payment successfull");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "" });
    });
});
router.post("/apply-coupon", verifyLogin, async (req,res)=>{
  let user = req.session.user;
  let userid = user._id;
  let total=req.body.total
  let Id=req.body.couponId
  
  console.log("idtto",Id);
  let coupon = await productHelpers.getAllCoupon(Id)
  console.log("singlecoupon",coupon);

  productHelpers.couponAmount(Id,total,userid).then((response) => {
       console.log("response",response)
       if(response.success){
         res.json({couponSuccess:true, total:response.total});
       }else if(response.couponUsed) {
         res.json({couponUsed:true})
       }   
     });
  
  })
  router.post("/apply-wallet", verifyLogin, (req,res)=>{
    let user = req.session.user;
    let userid = user._id;
    let amount = req.body.walletInput;
    let total=req.body.total
    
console.log("walletamount",amount);
    productHelpers.walletAmount(userid,amount,total).then((response) => {
      console.log("response",response)
      if(response.success){
        res.json({walletSuccess:true, amount:response.amount, total:response.total});
      }else if(response.noBalance) {
        res.json({noBalance:true})
      }   
    });

  })
router.post("/search", async(req,res)=>{
  let payload = req.body.payload.trim();
  let search = await productHelpers.searchProduct(payload);
  search = search.slice(0, 10);
  res.send({ payload: search })
})


module.exports = router;
