const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');

const users = require('../models/users');
const secretKey = process.env.JWT_SECRET_KEY; 

const loginController = async (req, res) => {
    const { username, password } = req.body;
    console.log(`request received: Username: ${username}, Password: ${password} `);
    
    try {

        const user = await users.findOne({username:username});
        if (user) {            
            if (await bcrypt.compare(password, user.password) ){
                console.log("authenticted");
                const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
                res.cookie('token', token,
                    {
                        httpOnly: true,
                        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'strict',
                        maxAge: 60 * 60 * 1000,
                        secure: process.env.NODE_ENV === 'production',
                        path: '/',
                    }
                );
                res.json({ token: token, success: true, message: "Logged in successfully" });
            }
            else 
                res.json({ success: false, message: "Incorrect Password" });
        }

        else res.json({ success: false, message: "User does not exist" });

    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }

}

const registerController = async (req, res) => {
    console.log("registration api hit");
    const { name, username, password } = req.body;
    try {
        const user = await users.findOne({username:username});
        if (!user) {
            const encryptedPassword=await bcrypt.hash(password,10);

            const newUser = new users({ name, username, password: encryptedPassword });
            await newUser.save();

            console.log("New user created.");

            res.json({ success: true, message: "Registered successfully" });
        }
        else {
            res.json({ success: false, message: "Username already in use" });
        }

    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }

}

const fetchProfileController = async (req, res) => {
    const username = req.username;
    try {
        const user = await users.findOne({ username: username }).exec();
        if (user) {
            const { name, username } = user;
            res.status(200).json({ success: true, user: { name, username } });
        }
        else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}

const updateProfileController = async (req, res) => {
    const username = req.username;
    const {name} = req.body;
    try {
        const user = await users.findOne({ username: username }).exec();
        if (user) {
            user.name = name || user.name;
            await user.save();
            res.status(200).json({ success: true, message: "Profile updated successfully" });
        }
        else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {loginController, registerController, fetchProfileController, updateProfileController};