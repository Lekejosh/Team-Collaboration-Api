const mongoose = require('mongoose')

const attachementSchema = new mongoose.Schema({
cardId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Card'
},
link:{
    type:String,
}
})

module.exports = mongoose.model('Attachement',attachementSchema)