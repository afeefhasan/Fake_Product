const mongoose = require('mongoose');

let RetailerSchemas=mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        },
        location:{
            type:String,
            required:true
        }
    }
);

module.exports = RetailerSchemas = mongoose.model('retailer',RetailerSchemas);