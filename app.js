const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const userModel = require('./models/userModel');
const postModel = require('./models/postModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const MONGO_URI = "mongodb://localhost:27017/MiniProject"; // Replace with your database name or Atlas URI
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Connection Error:", err));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate('post');
    
    res.render('profile', {user});
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate('user');

    if(post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }


    await post.save();
    res.redirect('/profile');
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate('user');

    res.render('edit', {post});
});

app.post('/update/:id', isLoggedIn, async (req, res) => {
     await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});

    res.redirect("/profile");
});


app.post('/register', async (req, res) => {
    let {email, password, username, age, name} = req.body;

    let user = await userModel.findOne({email: email});
    if(user) return res.status(500).send("User already registered");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    let createduser = await userModel.create({
        username,
        email,
        password: hashedPassword,
        age,
        name

    });
    let token = jwt.sign({email: email, userid: user._id}, "shhhhhhhhhhh");
    res.cookie('token', token);
    res.send("register");
    res.send(createduser);

    

});

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });

    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");
});   


app.post('/login', async (req, res) => {
    let {email, password} = req.body;

    let user = await userModel.findOne({email: email});
    if(!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if(result) {
            let token = jwt.sign({email: email, userid: user._id}, "shhhhhhhhhhh");
            res.cookie('token', token);
            return res.status(200).redirect("/profile");
        }
        else return res.redirect('/login');
    });


});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login');
});

function isLoggedIn(req, res, next){
    if(req.cookies.token === "") return res.redirect("/login");
    else {
        let data = jwt.verify(req.cookies.token, "shhhhhhhhhhh");
        req.user = data;
        next();
    }
}
    

app.listen('3000', () => {
    console.log('Server is running on port 3000');
});