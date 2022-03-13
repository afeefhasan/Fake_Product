const mongoose = require('mongoose');

let UserSchemas=mongoose.Schema(
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
        phone:{
            type:String,
            required:true
        }
    }
);

module.exports = UserSchemas = mongoose.model('user',UserSchemas);