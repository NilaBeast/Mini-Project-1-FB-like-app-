const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    date: {
        type: Date,
        default: Date.now
    },
    content: String,
    likes: [
       { type: mongoose.Schema.Types.ObjectId, ref: 'user'}
]
});

const postModel = mongoose.model("post", postSchema);
module.exports = postModel;