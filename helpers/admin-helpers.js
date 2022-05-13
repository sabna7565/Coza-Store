var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { reject, promise } = require('bcrypt/promises')
var objectId=require('mongodb').ObjectId
const moment = require('moment');

const { resolve } = require('path')


module.exports = {
    doSignup: (adminData) =>{
        return  new Promise(async(resolve,reject)=>{
    
            adminData.Password=await bcrypt.hash(adminData.Password, 10)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
                resolve(data.insertedId)
    
            })
        })
    },
doLogin: (adminData)=>{
    return new Promise( async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let admin= await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
        if(admin){
            bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                if(status){
                    console.log('Admin Login Success')
                    response.admin=admin
                    response.status=true   
                    resolve(response) 
                }else{
                    console.log('Admin pwd not match, login failed')
                    resolve({status:false})
                }
            })

        }else{
            console.log('admin email not found, login failed    ');
            resolve({status:false})
        }
    })
},



monthlyReport:()=>{
    return new Promise(async(res,rej)=>{        
            let today=new Date()
            let end= moment(today).format('YYYY/MM/DD')
            let start=moment(end).subtract(30,'days').format('YYYY/MM/DD')
            let datas={}
            try{

              await  Promise.all([
            db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'shipped' }).toArray(),
               db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'placed'}).toArray(),
                db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'pending'}).toArray(),
               db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'cancelled'}).toArray(),
               db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'delivered'}).toArray(),
   
              db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray(),
               db.get().collection(collection.USER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray(),
               db.get().collection(collection.PRODUCT_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray(),
               db.get().collection(collection.ORDER_COLLECTION).find({payment:"Razorpay"}).toArray(),
               db.get().collection(collection.ORDER_COLLECTION).find({payment:"Paypal"}).toArray(),
              db.get().collection(collection.ORDER_COLLECTION).find({payment:"COD"}).toArray(),
              db.get().collection(collection.ORDER_COLLECTION).aggregate([
                   {
                       $match:{$and:[{status:{$ne:'cancelled'}},{status:{$ne:'pending'}}]}
                   },
                   {
                       $group:{
                           _id:null,
                           total:{$sum:"$total"}                           
                       }
                       
                   }
               ]).toArray()
   
           ])
           .then((data)=>{
               console.log("total",data[11]);
               let orderShippedLength = data[0].length
               let orderPlacededLength = data[1].length
               let orderPendingLength = data[2].length
               let orderCancelLength = data[3].length
               let orderDeliveredLength = data[4].length
               let allUsersLength = data[6].length
               let allProdcutsLength = data[7].length
               let razropayLength = data[8].length
               let paypalLength = data[9].length
               let codLength = data[10].length
               let orderTotalLength = data[5].length
               let total = data[11][0].total       
   
                console.log("total od",total)
   
               
                 datas. start= start,
                 datas.end= end,
                 datas.totalOrders= orderTotalLength,
                 datas.shippedOrders= orderShippedLength,
                 datas.placedOrders= orderPlacededLength,
                 datas. pendingOrders= orderPendingLength,
                 datas. deliveredOrders= orderDeliveredLength,
                 datas. totalSales= total,
                 datas. cod= codLength,
                 datas. paypal= paypalLength,
                 datas. razorpay= razropayLength,
                 datas. cancelOrders= orderCancelLength,
                 datas. allUsers=  allUsersLength,
                 datas. totalProdcuts= allProdcutsLength            
            
            
               
           }).catch((err)=>{
               console.log("errormomthlyreport",err)
               rej(err)
           })
           res(datas)
           console.log('ooooo',datas);
            }catch(err){
                console.log('errorrr',err);
                rej(err)
            }

    //         
       })
       
},

salesReport:(details)=>{
    return new Promise(async(res,rej)=>{
        let end= moment(details.EndDate).format('YYYY/MM/DD')
        let start=moment(details.StartDate).format('YYYY/MM/DD')
        console.log("gdfsgd",start,end)
        let orderShipped= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'shipped' }).toArray()
        let orderPlaced= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'placed'}).toArray()
        let orderPending= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'pending'}).toArray()
        let orderCancel= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'cancelled'}).toArray()
        let orderDelivered= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'delivered'}).toArray()

        // let orderSuccess= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:{ $ne: 'pending' }}).toArray()
        let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
        let allUsers = await db.get().collection(collection.USER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
        let allProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
        let razorpay = await db.get().collection(collection.ORDER_COLLECTION).find({payment:"Razorpay"}).toArray()
        let paypal = await db.get().collection(collection.ORDER_COLLECTION).find({payment:"Paypal"}).toArray()
        let cod = await db.get().collection(collection.ORDER_COLLECTION).find({payment:"COD"}).toArray()
        let totalAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{$and:[{status:{$ne:'cancelled'}},{status:{$ne:'pending'}}]}
            },
            {
                $group:{
                    _id:null,
                    total:{$sum:"$total"}
                }
            }
        ]).toArray()
        let orderShippedLength = orderShipped.length;
        let orderPlacededLength = orderPlaced.length;
        let orderPendingLength = orderPending.length;
        let orderCancelLength = orderCancel.length;
        let orderDeliveredLength = orderDelivered.length;
        let allUsersLength = allUsers.length;
        let allProdcutsLength = allProducts.length;
        let razropayLength = razorpay.length;
        let paypalLength = paypal.length;
        let codLength = cod.length;
        // let orderSuccessLength = orderSuccess.length
        let orderTotalLength = orderTotal.length;
        let total = totalAmount[0].total;
    



        var data = {
           start: start,
           end: end,
           totalOrders: orderTotalLength,
           shippedOrders: orderShippedLength,
           placedOrders: orderPlacededLength,
           pendingOrders: orderPendingLength,
           deliveredOrders: orderDeliveredLength,
           totalSales: total,
           cod: codLength,
           paypal: paypalLength,
           razorpay: razropayLength,
           cancelOrders: orderCancelLength,
           allUsers:  allUsersLength,
           totalProdcuts: allProdcutsLength


  
       }
   res(data)
   })
},
getDatedOrders:(details)=>{
    return new Promise(async (resolve, reject) => {
      let end= moment(details.EndDate).format('YYYY/MM/DD')
      let start=moment(details.StartDate).format('YYYY/MM/DD')
      console.log("gdfsgd",start,end)
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({date:{$gte:start,$lte:end}}).sort({$natural:-1})
        .toArray();
      resolve(orders);
    });
  },
}