var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { reject, method } = require('lodash')
var objectId=require('mongodb').ObjectId
const Razorpay = require('razorpay')
const moment = require('moment');
var instance = new Razorpay({
    key_id: 'rzp_test_CzVca40KU9CHw6',
    key_secret: 'WPmKxXuCxVQ6Q9mVbcf1ANyO',
});

module.exports={
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
             userData.wallet = userData.wallet ? userData.wallet : 0
            var dat = new Date().toISOString();
            var dates = moment(dat).format("YYYY/MM/DD");
            userData.Password = await bcrypt.hash(userData.Password, 10)
            user = {
                name: userData.name,
                email: userData.email,
                phone: `+91${userData.phone}`,
                Password: userData.Password,
                status: userData.status,
                date: dates,
                refer:userData.refer,
                referedBy:userData.referedBy
            }
           
            db.get().collection(collection.USER_COLLECTION).insertOne(user).then((data)=>{

                resolve(data.insertedId)

            })

            if (userData.wallet){
               let referedByUser = await db.get().collection(collection.USER_COLLECTION).findOne({_id:userData.referedBy})
                if(referedByUser){
                   let wallet=await db.get().collection(collection.WALLET_COLLECTION).findOne({user:userData.referedBy}) 
                     if(wallet){
                        let amt=50                            
                        db.get().collection(collection.WALLET_COLLECTION)
                        .updateOne({user:userData.referedBy},
                        {   
                            
                                 $inc:{
                                    'amount':amt
                                }
                        }
                        
                        ).then((response)=>{
                           resolve()
                        })
                    }else{
                        let wallObj={
                            user:userData.referedBy,
                            amount:50
                        }
                        db.get().collection(collection.WALLET_COLLECTION)
                        .insertOne(wallObj).then((data)=>{
                        resolve()
                    })
                }  
                    
                }
            }
    
        })
    },
    checkReferal:(referedBy)=>{
        return new Promise(async (resolve, reject) => {
            let refer = await db.get().collection(collection.USER_COLLECTION).find({refer: referedBy}).toArray()
            if(refer){
                resolve(refer)
            }else{
                resolve(err)
            }
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
             if (user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                       response.user=user
                        response.status=true  
                        resolve(response)
                    }else{
                       
                        resolve({status:false})
                    }
                })
            }else{
               
                resolve({status:false})           
            }
      })
    },
    
    getUserdetails:(No)=>{
        return new Promise(async(res,rej)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({phone:No})
            res(user)
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async (resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId)},
                    {                      
                        $push:{products:proObj}                        
                    }
                ).then((response)=>{
                    resolve()
                })
            }
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },

    addToWhish:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1,
            
        }
        return new Promise(async (resolve,reject)=>{
            let userWhish=await db.get().collection(collection.WHISH_COLLECTION).findOne({user:objectId(userId)})
            if(userWhish){
                let proExist=userWhish.products.findIndex(product=>product.item==proId)
                if(proExist!=-1){
                    db.get().collection(collection.WHISH_COLLECTION)
                    .updateOne({_id:objectId(userId)},
                    {
                        $pull:{products:{item:objectId(proId)}}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.WHISH_COLLECTION)
                .updateOne({user:objectId(userId)},
                    {                      
                        $push:{products:proObj}                        
                    }
                ).then((response)=>{
                    resolve(response)
                })
            }
            }else{
                let whishObj={
                    user:objectId(userId),
                    products:[proObj],
                    
                }
                db.get().collection(collection.WHISH_COLLECTION).insertOne(whishObj).then((response)=>{
                    resolve(response)
                })
            }
        })
    },

    
    removeCart:(proId,userId)=>{
        return new Promise((resolve, reject) => {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                  {user : objectId(userId)},
                 { $pull : { products: { item: objectId(proId)}}}                
               )
              .then(() => {
                resolve();
              });
          });
    },

    removeWhish:(proId,userId)=>{
        return new Promise((resolve, reject) => {
            db.get()
              .collection(collection.WHISH_COLLECTION)
              .updateOne(
                  {user : objectId(userId)},
                 { $pull : { products: { item: objectId(proId)}}}                
               )
              .then(() => {
                resolve();
              });
          });
    },
    
    getCartProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{            
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product', 0]}
                    }
                }               
            ]).toArray()
            resolve(cartItems)
        })
    },


    getWhishProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{            
            let whishItems=await db.get().collection(collection.WHISH_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product', 0]}
                    }
                }               
            ]).toArray()
            resolve(whishItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CART_COLLECTION)
        .findOne({user:objectId(userId)})
        if(cart){
            count=cart.products.length
        }
        resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count);
        details.quantity=parseInt(details.quantity)

        return  new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeProduct:true})
            })
        }else{            
        db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }
            ).then((response)=>{
                resolve({status:true})
            })
        } 
        })
    },

    
    updateProfile:(userId,userDetails)=>{      
            userDetails.phone=parseInt(userDetails.phone)
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:objectId(userId)},{
                    $set:{
                        name:userDetails.name,
                        email:userDetails.email,                       
                        phone: `+${userDetails.phone}`,
                    }
                }).then((response)=>{
                    resolve()
                })
                
            })
    },
    
    userProfile:(userId)=>{
        return new Promise((res,rej)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user1)=>{
               res(user1) 
            })  
        })
    },
    changePassword:(userId,details)=>{
        return new Promise(async (res,rej)=>{
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            if (user){
                data1=await bcrypt.hash(details.password1, 10)
               bcrypt.compare(details.password,user.Password).then((status)=>{
                   if(status){
                       response.status=true 
                       db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                           $set:{
                               Password:data1
                           }
                       }).then(()=>{
                           res(response)
                       })
                   }else{
                       response.status=false
                       res(response)
                   }
               })
           }
        })
    },
    addAddress:(userId,address)=>{
        return new Promise(async(resolve,reject)=>{
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
        if(user){
            address._id=objectId()
            if(user.address){                
                db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:objectId(userId)},
                {                   
                    $push:{address: address}
                 }  
                ).then((response)=>{
                    resolve()
                })
            }else{
                let add=[address]
                db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:objectId(userId)},{
                    $set:{
                        address:add
                    } 
            }).then((response)=>{
                resolve()
            })
        }
          
        }  
        })    
    },
    userAddress:(userId)=>{
        return new Promise(async(res,rej)=>{          
            let use= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
               res(use.address)                        
        })

    },
    orderUserAddress:(orderId)=>{
        return new Promise(async(res,rej)=>{          
            let use= await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
               res(use.deliveryDetails)
        })

    },
    deleteAddress:(addressId,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {
                $pull:{address:{_id:objectId(addressId)}}
            }
            ).then((response)=>{
                resolve(response)
            })
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve,reject)=>{            
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product', 0]}
                    }
                }, 
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }              
            ]).toArray()
            resolve(total[0].total)
        }) 
    },
    placeOrder:(order,products,total,name)=>{
        return new Promise((resolve,reject)=>{
            var dat = new Date().toISOString();
            var dates = moment(dat).format("YYYY/MM/DD");
          
            let status=order.payment==='COD'?'placed':'pending'
            let orderObj={
               deliveryDetails:{
                    name:name,
                    housename:order.name,
                    street:order.street,
                    city:order.city,
                    pincode:order.pincode,
                    state:order.state,
                },
                userId:objectId(order.userId),
                payment:order.payment,
                products:products,
                total:total,
                status:status,
                cancel:true,
                date: dates
                

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{               
                // db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                resolve(response.insertedId)
            })
        })
    },
    clearCart:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(userId)})
            resolve(response.insertedId)
        })
    },


    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:objectId(userId)}).sort({$natural:-1}).toArray()

            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async (resolve,reject)=>{            
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }               
            ]).toArray()
           
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log(err)
                  }else{
                resolve(order)
                }
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require("crypto");
            let hmac = crypto.createHmac('sha256', 'WPmKxXuCxVQ6Q9mVbcf1ANyO')
            hmac.update(details['response[razorpay_order_id]']+'|'+details['response[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if(hmac==details['response[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        status:'placed'
                    }
                }
            ).then(()=>{
                resolve()
            })
        })
    },
    addWallet:(total,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let wallet=await db.get().collection(collection.WALLET_COLLECTION).findOne({user:objectId(userId)}) 
                     if(wallet){
                        let amt=parseInt(total)                            
                        db.get().collection(collection.WALLET_COLLECTION)
                        .updateOne({user:objectId(userId)},
                        {   
                            
                                 $inc:{
                                    'amount':amt
                                }
                        }
                        
                        ).then((response)=>{
                           resolve()
                        })
                    }else{
                        let wallObj={
                            user:objectId(userId),
                            amount:parseInt(total)
                        }
                        db.get().collection(collection.WALLET_COLLECTION)
                        .insertOne(wallObj).then((data)=>{
                        resolve(data.insertedId)
                    })
                }             
        })       
    },
    getWallet:(userId)=>{
        return new Promise((res,rej)=>{
            db.get().collection(collection.WALLET_COLLECTION).findOne({user:objectId(userId)}).then((wallet)=>{
               res(wallet) 
            })  
        })
    },
    getWhish:(userId)=>{
        return new Promise((res,rej)=>{
            db.get().collection(collection.WHISH_COLLECTION).findOne({user:objectId(userId)}).then((output)=>{
               res(output) 
            })  
        })
    }
}