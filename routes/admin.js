let express = require("express");
let router = express.Router();
let adminHelpers = require("../helpers/admin-helpers");
const productHelpers = require("../helpers/product-helpers");
const aduserHelpers = require("../helpers/aduser-helpers");
/* GET users listing. */
const verifyAdmin = (req, res, next) => {
  console.log("Verify Admin called");
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin");
  }
};

// router.get('/', (req, res) => {
//   res.render('admin/login', { adminlogin: true })
// });
router.get("/", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/login", {
      adminlogin: true,
      adLoginErr: req.session.adminLoginErr,
    });
  }
  req.session.adminLoginErr = false;
});
// router.post('/Login',(req,res)=>{
//   adminHelpers.doSignup(req.body).then((response)=>{
//     console.log(response)
//     res.render('/admin/view-products',{addmin:true})
//     })
//   })

router.post("/adLogin", (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.admin = response.admin;
      let adm = response.admin.status;
      res.redirect("/admin/dashboard");
    } else {
      req.session.adminLoginErr = true;
      res.redirect("/admin");
    }
  });
});

router.get("/dashboard", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  adminHelpers.monthlyReport().then((data) => {
    console.log("dashbord:", data);
    res.render('admin/dashboard',{admin,data}) 
  }).catch((err)=>{
    // res.status(400).send("order collection error"+err)
    res.status(400).render('admin/dashboard', {admin, err})

  })
  });

router.get("/view-products", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  let category = productHelpers.getAllCategories().then();
  productHelpers.getAllproducts().then((products) => {
    console.log(products);
    res.render("admin/view-products", { admin, products, category });
  });
});

router.get("/add-product", verifyAdmin, async (req, res) => {
  let admin = req.session.admin;
  let category = await productHelpers.getAllCategories().then();

  res.render("admin/add-product", { admin, category });
});
router.get("/add-category", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  res.render("admin/add-category", { admin });
});
router.get("/categories", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  productHelpers.getAllCategories().then((category) => {
    res.render("admin/categories", { admin, category });
  });
});
router.get("/view-users", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  aduserHelpers.getAllUsers().then((user1) => {
    user1.map((user1) => {
      user1.isUnblocked = user1.status === "unblock" ? true : false;
    });
    console.log(user1);
    res.render("admin/view-users", { admin, user1 });
  });
});
router.get("/view-orders", verifyAdmin,  async(req, res)=> {
  let admin = req.session.admin;
  let orders =await productHelpers.getAllOrders().then()
    console.log("orderid",orders);
    res.render("admin/view-orders", { admin, orders }); 
});

router.get('/status-change',verifyAdmin,(req,res)=>{
  let status=req.query.status
  let id=req.query.id
  if(status == "cancelled" ){
  productHelpers.changeCancelStatus(status,id).then()
  }
  else if(status == "delivered"){
    productHelpers.changeDeliveryStatus(status,id).then()
  }
  else{
    productHelpers.changeStatus(status,id).then()
  }
    res.redirect('/admin/view-orders') 
})
router.get("/adview-order-products/:id", verifyAdmin, async (req, res) => {
  let admin = req.session.admin;
   let products=await productHelpers.getOrderProducts(req.params.id)
  res.render("admin/adview-order-products", { admin, products});
});
router.post("/add-product", (req, res) => {
  console.log(req.body);
 
  productHelpers.addProduct(req.body, (id) => {
    let image1=req.files.image1
    let image2=req.files.image2
    let image3=req.files.image3
    let image4=req.files.image4


    image1.mv("./public/product-images/" + id +"-"+ 0 + '.jpg' )
    image2.mv("./public/product-images/" + id +"-"+ 1 + '.jpg' )
    image3.mv("./public/product-images/" + id +"-"+ 2 + '.jpg' )
    image4.mv("./public/product-images/" + id +"-"+ 3 + '.jpg' ),
    
   
    
    res.redirect("/admin/view-products");
   
  });  
  });

router.post("/add-category", (req, res) => {
  productHelpers.addCategory(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/category-images/" + id + ".jpg", (err) => {
      if (!err) {
        console.log("success");
      } else {
        console.log(err);
      }
    });
    if (res.status) {
      res.redirect("/admin/categories");
    } else {
      console.log(err);
    }
  });
});
router.get("/edit-user/:id", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  let id = req.params.id;
  console.log(id);
  aduserHelpers.updateUser(req.params.id).then(() => {
    res.redirect("/admin/view-users");
  });
});
router.get("/editt-user/:id", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  aduserHelpers.updateUserr(req.params.id).then(() => {
    res.redirect("/admin/view-users");
  });
});

router.get("/delete-product/:id", verifyAdmin, (req, res) => {
  let admin = req.session.admin;
  let proId = req.params.id;
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});

router.get("/edit-product/:id", verifyAdmin, async (req, res) => {
  let admin = req.session.admin;
  let category = await productHelpers.getAllCategories().then();
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product, category, admin });
});

router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin/view-products");
    
      
      let image1=req.files?.image1
    let image2=req.files?.image2
    let image3=req.files?.image3
    let image4=req.files?.image4
    image1.mv("./public/product-images/" + id +"-"+ 0 + '.jpg' )
    image2.mv("./public/product-images/" + id +"-"+ 1 + '.jpg' )
    image3.mv("./public/product-images/" + id +"-"+ 2 + '.jpg' )
    image4.mv("./public/product-images/" + id +"-"+ 3 + '.jpg' )
    
  }).catch((err)=>{
  res.status(400).send("edit product error"+err)
})
})

router.get("/sales", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  adminHelpers.monthlyReport().then(async(data) => {
    let orders =await productHelpers.getAllOrders().then()
    console.log("dashbord:", data);
    res.render('admin/sales', {admin,data, orders}) 
  });  
});

router.post("/sales", verifyAdmin, function (req, res) {
  let admin = req.session.admin;
  adminHelpers.salesReport(req.body).then(async(data) => {
  let orders =await adminHelpers.getDatedOrders(req.body).then()
    console.log("dashbord:", data);
    res.render('admin/sales', { admin,data, orders}) 
  });  
});

router.get("/view-productoffer", verifyAdmin, function (req, res) {
  let admin = req.session.admin; 
  productHelpers.getAllProductOffer().then((productOffer) => {
    console.log("daddygitrija",productOffer);
    res.render("admin/view-productoffer", { admin, productOffer });
  });
});


router.get('/add-productOffer', verifyAdmin, (req,res)=>{
  let admin = req.session.admin;
 productHelpers.getAllproducts().then((products)=>{
    res.render('admin/add-productOffer',{admin, products})
  })
})


router.post("/add-productOffer", (req, res) => {
  productHelpers.addProductOffer(req.body).then((response) => {
    console.log(response);
    if(response.exist){
      req.session.proOfferExist=true
      res.redirect("/admin/view-productoffer") 
    }else{
    res.redirect("/admin/view-productoffer")    
    }
  });
});

router.get('/delete-productOffer',  verifyAdmin, (req,res)=>{
    console.log("deleated",req.query.id);
  productHelpers.deleteProductOffer(req.query.id).then(()=>{
    res.redirect("/admin/view-productoffer")

  })
})
router.get("/view-categoryoffer", verifyAdmin, function (req, res) {
  let admin = req.session.admin; 
  productHelpers.getAllCategoryOffer().then((categoryOffer) => {
    console.log("gycategcat",categoryOffer);
    res.render("admin/view-categoryoffer", { admin, categoryOffer });
  });
});
router.get('/add-categoryOffer', verifyAdmin, (req,res)=>{
  let admin = req.session.admin;
 productHelpers. getAllCategories().then((categories)=>{
    res.render('admin/add-categoryOffer',{admin, categories})
  })
});
router.post("/add-categoryOffer", (req, res) => {
  productHelpers.addCategoryOffer(req.body).then((response) => {
    console.log(response);
    if(response.exist){
      req.session.proOfferExist=true
      res.redirect("/admin/view-categoryoffer") 
    }else{
    res.redirect("/admin/view-categoryoffer")    
    }
  });
});

router.get('/delete-categoryOffer',  verifyAdmin, (req,res)=>{
    console.log("deleated",req.query.id);
  productHelpers.deleteCategoryOffer(req.query.id).then(()=>{
    res.redirect("/admin/view-categoryoffer")

  })
});
router.get("/view-coupon", verifyAdmin, function (req, res) {
  let admin = req.session.admin; 
  productHelpers.getAllCoupons().then((coupon) => {
    console.log("hhhhht",coupon);
    res.render("admin/view-coupon", { admin, coupon });
  });
});
router.get('/add-coupon', verifyAdmin, (req,res)=>{
  let admin = req.session.admin;
   res.render('admin/add-coupon',{admin})
});
router.post("/add-coupon", (req, res) => {
  productHelpers.addCoupon(req.body).then((response) => {
    console.log(response);   
    res.redirect("/admin/view-coupon")       
  });
});

router.get('/delete-coupon', verifyAdmin, (req,res)=>{
  console.log("deleated",req.query.id);
productHelpers.deleteCoupon(req.query.id).then(()=>{
  res.redirect("/admin/view-coupon")

})
});
router.get("/logout", verifyAdmin, (req, res) => {
  req.session.admin = null;
  res.redirect("/admin");
});
module.exports = router;
