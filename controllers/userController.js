const User = require('../models/userModel')
const errorHandler = require('../middlewares/errorHandler')

exports.register = errorHandler(async(req,res)=>{

    const {name,email,password} = req.body


})

exports.login = errorHandler(async (req, res) => {});
