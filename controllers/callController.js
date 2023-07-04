const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const {v4:uuidv4} = require('uuid')
const User = require('../models/userModel')
const Chat = require('../models/chatModel')
const Message = require('../models/messageModel')
const ErrorHandler = require('../utils/errorHandler')

exports.call = catchAsyncErrors(async(req,res,next)=>{
    const {chat}= req.query
    const user = await User.findById(req.user._id)
    if(!user){
        return next(new ErrorHandler("User not found",404))
    }
    
})