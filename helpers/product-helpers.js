const { reject } = require("bcrypt/promises");
var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const moment = require("moment");

module.exports = {
  addCategory: (category, callback) => {
    db.get()
      .collection("category")
      .insertOne(category)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  addProduct: (product, callback) => {
    db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .insertOne({
        Name: product.Name,
        Category: product.Category,
        Price: product.Price,
        Description: product.Description,
        date: moment(new Date()).format("YYYY/MM/DD"),
      })
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getAllproducts: () => {
    return new Promise(async (resolve, reject) => {
       try { 
         let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()       
        .toArray();
      resolve(products);
    }catch(err){
     reject(err)
    }
    });
  },
  getAllCategories: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(categories);
    });
  },

  getCatDetails: (cat) => {
    return new Promise(async (resolve, reject) => {
      let catproducts = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: cat })
        .toArray();
      resolve(catproducts);
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(proId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  updateProduct: (proId, proDetails) => {
    proDetails.Price = parseInt(proDetails.Price);
    return new Promise((resolve, reject) => {
     try{  db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              Name: proDetails.Name,
              Description: proDetails.Description,
              Price: proDetails.Price,
              Category: proDetails.Category,
              date: moment(new Date()).format("YYYY/MM/DD"),
            },
          }
        )
        resolve()
    
  }catch(err){
    reject(err)
  }
});
  },
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },

  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find().sort({$natural:-1})
        .toArray();
      resolve(orders);
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },
  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
              cancel: true,
              delivery: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },  
  changeCancelStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
              cancel: false,
              delivery: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  changeDeliveryStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
              delivery: true,
              cancel: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  changeReturnStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
              delivery: false,
              cancel: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  handleWishlist: (wishlist, products) => {
    return new Promise((resolve, reject) => {
        if (wishlist?.products) {
        wishlist = wishlist.products.map((product) => product.item.toString());
        products.forEach((product) => {
          if (wishlist.includes(product._id.toString())) {
            product.wish = true;
          }
        });
      }
      resolve(products);      
    });
  },

  addProductOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      data.startDate = moment(data.startDate).format("YYYY/MM/DD");
      data.endDate = moment(data.endDate).format("YYYY/MM/DD");
      let response = {};
      let exist = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ Name: data.Product, offer: { $exists: true } });
      if (exist) {
        response.exist = true;
        resolve(response);
      } else {
        db.get()
          .collection(collection.PRODUCT_OFFERS)
          .insertOne(data)
          .then((response) => {
            resolve(response);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  },

  getAllProductOffer: () => {
    return new Promise((res, rej) => {
      let productoff = db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .find()
        .toArray();
      res(productoff);
    });
  },
  deleteProductOffer: (Id) => {
    return new Promise(async (resolve, reject) => {
      let productoff = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .findOne({ _id: objectId(Id) });
      let proname = productoff.product;
      let Product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ Name: proname });
      db.get()
        .collection(collection.PRODUCT_OFFERS)
        .deleteOne({ _id: objectId(Id) });
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { Name: proname },
          {
            $set: {
              Price: Product?.actualPrice,
            },
            $unset: {
              actualPrice: "",
              offer: "",
              percentage: "",
            },
          }
        )
        .then(() => {
          resolve();
        })
        .catch((err) => {
          res(err);
        });
    });
  },

  startProductOffer: (todayDate) => {
    let proStartDate = moment(todayDate).format("YYYY/MM/DD");
    return new Promise(async (res, rej) => {
      let data = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .find({ startDate: { $lte: proStartDate } })
        .toArray();      
      if (data) {
        await data.map(async (onedata) => {
          let product = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .findOne({ Name: onedata.product, offer: { $exists: false } });
            if (product) {
            let actualPrice = product.Price;
            let newP = (product.Price * onedata.percentage) / 100;
            let newPrice = actualPrice - newP;

            newPrice = newPrice.toFixed();
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: objectId(product._id) },
                {
                  $set: {
                    actualPrice: parseInt(actualPrice),
                    Price: parseInt(newPrice),
                    offer: true,
                    percentage: parseInt(onedata.percentage),
                  },
                }
              );
            res();
          } else {
            res();
          }
        });
      } else {
        res();
      }
    });
  },
  getAllCategoryOffer: () => {
    return new Promise((res, rej) => {
      let categoryoff = db.get().collection(collection.CATEGORY_OFFERS).find().toArray();
      res(categoryoff);
    });
  },
  addCategoryOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      data.startDate = moment(data.startDate).format("YYYY/MM/DD");
      data.endDate = moment(data.endDate).format("YYYY/MM/DD");

      let exist = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .findOne({ category: data.category });
      
      if (exist) {
        resolve();
      } else {
        db.get()
          .collection(collection.CATEGORY_OFFERS)
          .insertOne(data)
          .then((response) => {
            resolve(response);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  },
  deleteCategoryOffer: (Id) => {
    return new Promise(async (res, rej) => {
      let categoryOffer = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .findOne({ _id: objectId(Id) });
     
      let catName = categoryOffer.category;
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: catName }, { offer: { $exists: true } })
        .toArray();
      if (product) {
        db.get()
          .collection(collection.CATEGORY_OFFERS)
          .deleteOne({ _id: objectId(Id) })
          .then(async () => {
            await product.map((product) => {
              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(product._id) },
                  {
                    $set: {
                      Price: product.actualPrice,
                    },
                    $unset: {
                      offer: "",
                      percentage: "",
                      actualPrice: "",
                    },
                  }
                )
                .then(() => {
                  res();
                });
            });
          });
      } else {
        res();
      }
    });
  },
  startCategoryOffer: (date) => {
    let catStartDate = moment(date.startDate).format("YYYY/MM/DD");
    
    return new Promise(async (res, rej) => {
      let data = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .find({ startDate: { $lte: catStartDate } })
        .toArray();
      if (data.length > 0) {
        await data.map(async (onedata) => {
         let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ Category: onedata.category, offer: { $exists: false } })
            .toArray();         
          await products.map(async (product) => {            
            let actualPrice = product.Price;
            let newPrice = (product.Price * onedata.percentage) / 100;
            newPrice = newPrice.toFixed();            
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: objectId(product._id) },
                {
                  $set: {
                    actualPrice: parseInt(actualPrice),
                    Price: parseInt(actualPrice - newPrice),
                    offer: true,
                    percentage: parseInt(onedata.percentage),
                  },
                }
              );
          });
        });
        res();
      } else {
        res();
      }
    });
  },
  getAllCoupons:()=>{
    return new Promise((res, rej) => {
      let coupon = db.get().collection(collection.COUPON_COLLECTION).find().sort({$natural:-1}).toArray();
      res(coupon);
    });
  },
  addCoupon:(data)=>{
    return new Promise((resolve, reject) => {
      data.startDate = moment(data.startDate).format("YYYY/MM/DD");
      data.endDate = moment(data.endDate).format("YYYY/MM/DD");

      coupon = {
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        percentage: data.percentage,
        user:[]      
    }
    db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((data)=>{

      resolve(data.insertedId)

  }).catch((err) => {
            reject(err);
          });
      
    });
  },
  deleteCoupon:(Id)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(Id)})
      resolve()
  })
  },
startCouponOffers:(date)=>{
  let couponStartDate = moment(date).format("YYYY/MM/DD");
  return new Promise(async(res,rej)=>{
      let data= await db.get().collection(collection.COUPON_COLLECTION).find({$and:[{startDate:{$lte:couponStartDate}},{endDate:{$gt:couponStartDate}}]}).toArray()
      if(data.length >0){
          await data.map((onedata)=>{
              db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:objectId(onedata._id)},{
                $set:{
                  Available: true
                }
              }).then(()=>{
                  res()
              })
          })
      }else{
          res()
      }
  })
},
getAvailableCoupons:()=>{
  return new Promise((res, rej) => {
    let coupon = db.get().collection(collection.COUPON_COLLECTION).findOne({Available: true})
    res(coupon);
  });
},
walletAmount:(userId,amt,total)=>{
  return new Promise(async(resolve, reject) => {
    let obj={}
    let wallet = await db.get().collection(collection.WALLET_COLLECTION).findOne({ user: objectId(userId) })
    if(wallet){
      if(amt>wallet.amount){
        obj.noBalance = true
        resolve(obj)
      }else{
        obj.amount=amt
        obj.total = total
        obj.success = true
        resolve(obj)
      }    
    }      
})
},
couponAmount:(couponId,total,userId)=>{
   return new Promise(async(resolve, reject) => {
    let obj={}
    let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: objectId(couponId) })
    if(coupon){
      let users = coupon.user.toString()
       let userChecker = users.includes(userId)
       if(userChecker){
        obj.couponUsed = true;
        resolve(obj)         
      }
      else {
        let tot = (total * coupon.percentage) / 100;
        obj.total = tot
        obj.success = true
        resolve(obj)
        
      }
    }      
})
},
getAllCoupon:(couponId)=>{
  return new Promise(async(resolve, reject) => {
    let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: objectId(couponId) })
      resolve(coupon);     
})
},
addCouponUser:(couponId,userId)=>{
  return new Promise(async(resolve,reject)=>{
    let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({_id:objectId(couponId)})
    if(coupon){                      
            db.get().collection(collection.COUPON_COLLECTION)
            .updateOne({_id:objectId(couponId)},
            {                   
                $push:{user: userId}
             }  
            ).then((response)=>{
                resolve()
            })    
    }  
    }) 
},
walletReduction:(walletAmount,userId)=>{
  return new Promise(async(resolve,reject)=>{
    let wallet=await db.get().collection(collection.WALLET_COLLECTION).findOne({user:objectId(userId)})

    if(wallet){
    let Wallet = parseInt(walletAmount);
    let amount = wallet.amount - Wallet
    db.get().collection(collection.WALLET_COLLECTION).updateOne({user:objectId(userId)},{
        $set:{
            amount:amount
        } 
}).then((response)=>{
    resolve()
})
}
  })
},
searchProduct:(name)=>{
  return new Promise(async(resolve,reject)=>{
      let search= await db.get().collection(collection.PRODUCT_COLLECTION).find({Name:{$regex:new RegExp('^'+name+'.*','i')}}).toArray();
      resolve(search)
  })

}
}
                      