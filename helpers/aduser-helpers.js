var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt = require('bcrypt')
var objectId=require('mongodb').ObjectId

module.exports={
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let user1=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(user1)
        })
    },
    updateUser:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    status:"block"
                }
            }).then((response)=>{
                resolve()
            })
            
        })
    },
    updateUserr:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    status:"unblock"
                }
            }).then((response)=>{
                resolve()
            })
            
        })
    },
    getOrderUsers:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((orderuser)=>{
                resolve(orderuser)
            })
        })
    }
    
}