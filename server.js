const express = require('express');
const app = express();
// const session = require('express-session');
const path = require('path');
const solc = require('solc');
const Provider = require('@truffle/hdwallet-provider');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const crypto = require('crypto');
var Web3 = require('web3');
const BigNumber = require('bignumber.js');
const fs = require('fs');
const mongoose = require('mongoose');
const UserSchema=require('./schemas/user');
const RetailerSchema=require('./schemas/retailer');
const pathToContract="./contracts/block.sol";
const address="0xA33677B171F5e419884505e9e4e67165EcF0C9Fc";
const privatekey="exchange cabbage someone alley vague short village toss recall visa corn gold";
const infuraURL="https://rinkeby.infura.io/v3/4ab70f9d52854f799be42c232951a760"
const MyContract = require('./build/contracts/MyContract.json');


//connect to mongoDB
const uri='mongodb+srv://AuthProduct:eAiucg9T8yfxQSFa@cluster0.ifzch.mongodb.net/Products_Auth?retryWrites=true&w=majority';

const connectToDatabase = async () => {
    try{
        await mongoose.connect(uri,{
                useUnifiedTopology: true,
            useNewUrlParser: true
        })
        console.log("MongoDB is connected");
    } catch(error){
        console.log(error);

        process.exit(1);
    }
}
connectToDatabase();

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const content = fs.readFileSync(pathToContract, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'contract': { content }
  },
  settings: {
    outputSelection: { '*': { '*': ['*'] } }
  }
};

const provider = new Provider(privatekey, infuraURL );
var web3 = new Web3(provider);
var myContract;

async function deploy (){
    console.log("Deploying Smart Contract!");
    const networkId = await web3.eth.net.getId();
    const myContract = new web3.eth.Contract(
      MyContract.abi,
      MyContract.networks[networkId].address
    );
  
  
    // console.log(`Old data value: ${await myContract.methods.data().call()}`);
    // const receipt = await myContract.methods.setData(3).send({ from: address });
    // console.log(`Transaction hash: ${receipt.transactionHash}`);
    // console.log(`New data value: ${await myContract.methods.data().call()}`);
    return myContract;
  };
  myContract=deploy();

// This function generates a QR code
function generateQRCode() {
    return crypto.randomBytes(20).toString('hex');
}

// Hash email using md5
function hashMD5(email) {
    return crypto.createHash('md5').update(email).digest('hex');
}

// Routes for webpages
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/views/davidshimjs-qrcodejs-04f46c6'));

// Manufacturer generates a QR Code here
app.get('/createCodes', (req, res) => {
    res.sendFile('views/createCodes.html', { root: __dirname });
});

// Creating a new retailer
app.get('/createRetailer', (req, res) => {
    res.sendFile('views/createRetailer.html', { root: __dirname });
});

// Main website which has 2 routers - manufacturer & retailer
app.get('/', (req, res) => {
    res.sendFile('views/index.html', { root: __dirname });
});


/**
 * Description: Adds a user to the database and to the blockchain
 * Request:     POST /signUp
 * Send:        JSON object which contains name, email, password, phone
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/signUp', async(req, res) => {
	try{
    console.log('Request to /signUp\n');
    let {name,email,password,phone} = req.body;
	const salt = await bcrypt.genSalt(10);
    let hashedPassword  = await bcrypt.hash(password,salt);

    console.log(`Email: ${email} \n`);
	let user = await UserSchema.findOne({email: email});
	// Check if user already exists
	if(user){
		return res.status(400).send('User already exists');
	}
	// Create a new user
	let newUser = new UserSchema({
		name: name,
		email: email,
		password: hashedPassword,
		phone: phone,
	});
	// Save the user to the database
	await newUser.save();
	hashedEmail = hashMD5(email);
	let ok = createCustomer(hashedEmail, name, phone);
	if (ok) {
		console.log(`User ${hashedEmail} successfully added to Blockchain!\n`);
	} else {
		console.log('ERROR! User could not be added to Blockchain.\n');
	}
	res.status(200).send('User successfully added');
}
catch(err){
	console.log(err);
	res.status(500).json({ msg : "Server Error....."});
}

});

// Add the user in Blockchain
function createCustomer(hashedEmail, name, phone) {
    return myContract.methods.createCustomer(hashedEmail, name, phone).send({from: address, gas: 3000000});
}


/**
 * Description: Login the user to the app
 * Request:     POST /login
 * Send:        JSON object which contains email, password
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/login',async (req, res) => {
	try{
    console.log('Request to /login\n');
    let email = req.body.email;
    let password = req.body.password;
    console.log(`Email: ${email} \n`);
	let user = await UserSchema.findOne({email: email});
	if(!user){
		return res.status(401).json("Not Found");
	}
	let isPasswordMatch =await bcrypt.compare(password,user.password);

	if(isPasswordMatch === true){
		res.status(200).json(user);
		
	}
	else {
		res.status(401).json('wrong password');
	}
}catch(err){
	console.log(err);
	res.status(500).json({ msg : "Server Error....."});
}

});


/**
 * Description: Adds a retailer to the database and to the blockchain
 * Request:     POST /retailerSignUp
 * Send:        JSON object which contains name, email, password, location
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/retailerSignup',async (req, res) => {
	try{
    console.log('Request to /retailerSignup\n');
    let retailerEmail = req.body.email;
    let retailerName = req.body.name;
    let retailerLocation = req.body.location;
    let retailerPassword = req.body.password;
	const salt = await bcrypt.genSalt(10);
    let retailerHashedPassword = await bcrypt.hash(retailerPassword,salt);
    let retailerHashedEmail = hashMD5(retailerEmail);
    console.log(`retailerEmail: ${retailerEmail}, hashedEmail: ${retailerHashedEmail} \n`);
	let retailer = await RetailerSchema.findOne({email: retailerEmail});
	if(retailer){
		return res.status(400).send('Retailer already exists');
	}
	let newRetailer = new RetailerSchema({
		name: retailerName,
		email: retailerEmail,
		password: retailerHashedPassword,
		location: retailerLocation,
	});
	await newRetailer.save();
	let ok = createRetailer(retailerHashedEmail, retailerName, retailerLocation);
	if (ok) {
		console.log(`Retailer ${retailerHashedEmail} successfully added to Blockchain!\n`);
		return res.status(200).send('Retailer successfully added');
	} else {
		console.log('ERROR! Retailer could not be added to Blockchain.\n');
		return res.status(400).send('Retailer could not be added');
	}
}catch(err){
	console.log(err);
	res.status(500).json({ msg : "Server Error....."});
}

});

// Add retailer to Blockchain
async function createRetailer(retailerHashedEmail, retailerName, retailerLocation) {
    return await myContract.methods.createRetailer(retailerHashedEmail, retailerName, retailerLocation).send({from: address, gas: 3000000});
}


/**
 * Description: Login the retailer to the app
 * Request:     POST /retailerLogin
 * Send:        JSON object which contains email, password
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/retailerLogin', async(req, res) => {
	try{
    console.log('Request to /retailerLogin\n');
    let retailerEmail = req.body.email;
    let retailerPassword = req.body.password;
    console.log(`Email: ${retailerEmail} \n`);
	let retailer = await RetailerSchema.findOne({email: retailerEmail});
	if(!retailer){
		return res.status(401).json("Not Found");
	}
	let isPasswordMatch = await bcrypt.compare(retailerPassword,retailer.password);
	if (isPasswordMatch === true) {
		res.status(200).json(retailer);
	} else {
		res.status(401).json('wrong password');
	}
}catch(err){
	console.log(err);
	res.status(500).json({ msg : "Server Error....."});
}

});


/**
 * Description: Get reatiler details
 * Request:     GET /retailerDetails
 * Send:
 * Receive:     JSON object of retailer details if successful, 400 otherwise
 */
app.get('/retailerDetails',async (req, res) => {
	try{

	let retailer = await RetailerSchema.find({password:0});
	if(!retailer){
		return res.status(401).json("Not Found");
	}
	res.status(200).json(retailer);
}catch(err){
	console.log(err);
	res.status(500).json({ msg : "Server Error....."});
}


});


/**
 * Description: Add retailer to code
 * Request:     POST /addRetailerToCode
 * Send:        JSON object which contains code, email
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/addRetailerToCode', async(req, res) => {
    var myContract=await deploy();
    console.log('Request to /addRetailerToCode\n');
    let code = req.body.code;
    let retailerEmail = req.body.email;
    let hashedEmail = hashMD5(retailerEmail);
    console.log(`retailerEmail: ${retailerEmail}, hashed email: ${hashedEmail} \n`);
    let ok =await  myContract.methods.addRetailerToCode(code, hashedEmail);
    if(!ok) {
        return res.status(400).send('Error');
    }
    console.log(`Successfully added ${hashedEmail} to code ${code} \n`);
    return res.status(200).send('Success');
});


/**
 * Description: Lists all the assets owned by the user
 * Request:     POST /myAssets
 * Send:        JSON object which contains email
 * Receive:     JSON array of objects which contain brand, model, description, status, manufacturerName,manufacturerLocation,
 *                                                  manufacturerTimestamp, retailerName, retailerLocation, retailerTimestamp
 */
app.post('/myAssets', async(req, res) => {
    var myContract=await deploy();
    console.log('Request to /myAssets\n');
    let myAssetsArray = [];
    let email = req.body.email;
    let hashedEmail = hashMD5(email);
    let arrayOfCodes = await myContract.methods.getCodes(hashedEmail);
    console.log(`Email ${email}`);
    console.log(`Customer has these product codes: ${arrayOfCodes} \n`);
    for (code in arrayOfCodes) {
        let ownedCodeDetails = await myContract.methods.getOwnedCodeDetails(arrayOfCodes[code]);
        let notOwnedCodeDetails =await myContract.methods.getNotOwnedCodeDetails(arrayOfCodes[code]);
        myAssetsArray.push({
            'code': arrayOfCodes[code], 'brand': notOwnedCodeDetails[0],
            'model': notOwnedCodeDetails[1], 'description': notOwnedCodeDetails[2],
            'status': notOwnedCodeDetails[3], 'manufacturerName': notOwnedCodeDetails[4],
            'manufacturerLocation': notOwnedCodeDetails[5], 'manufacturerTimestamp': notOwnedCodeDetails[6],
            'retailerName': ownedCodeDetails[0], 'retailerLocation': ownedCodeDetails[1],
            'retailerTimestamp': ownedCodeDetails[2]
        });
    }
    res.status(200).send(JSON.parse(JSON.stringify(myAssetsArray)));
});


/**
 * Description: Lists all the assets owned by the user
 * Request:     POST /stolen
 * Send:        JSON object which contains code, email
 * Receive:     200 if product status was changed, 400 otherwise.
 */
app.post('/stolen',async (req, res) => {
    var myContract=await deploy();
    console.log('Request to /stolen\n');
    let code = req.body.code;
    let email = req.body.email;
    let hashedEmail = hashMD5(email);
    console.log(`Email: ${email} \n`);
    let ok =await myContract.methods.reportStolen(code, hashedEmail);
    if (!ok) {
        console.log(`ERROR! Code: ${code} status could not be changed.\n`);
        return res.status(400).send('ERROR! Product status could not be changed.');
    }
    console.log(`Product code ${code} successfully changed!\n`);
    res.status(200).send('Product status successfully changed!');
});


// This array keeps track of all the QR Codes in use
const QRCodes = [];

/**
 * Description: Sell a product from myAssets (aka your inventory)
 * Request:     POST /sell
 * Send:        JSON object which contains code, sellerEmail
 * Receive:     List of QR Codes owned by the seller if successful, 400 otherwise
 */
app.post('/sell', (req, res) => {
    console.log('Request to /sell\n');
    let code = req.body.code;
    let sellerEmail = req.body.email;
    console.log(`Email ${sellerEmail} \n`);
    hashedSellerEmail = hashMD5(sellerEmail);
    let currentTime = Date.now();         // Date.now() gets the current time in milliseconds
    let QRCode = generateQRCode();
    let QRCodeObj = {
        'QRCode': QRCode, 'currentTime': currentTime, 'sellerEmail': sellerEmail, 'buyerEmail': '',
        'code': code, 'confirm': '0', 'retailer': '0'
    };
    QRCodes.push(QRCodeObj);
    console.log(`Session created ${(JSON.stringify(QRCode))} \n`);
    res.status(200).send(JSON.parse(JSON.stringify(QRCode)));
});


/**
 * Description: Buy a product
 * Request:     POST /buy
 * Send:        JSON object which contains QRCode, email
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/buy', (req, res) => {
    console.log('Request to /buy\n');
    let QRCode = req.body.QRCode;
    let buyerEmail = req.body.email;
    let currentTime = Date.now();         // Date.now() gets the current time in milliseconds
    console.log(`Email: ${buyerEmail} \n`);
    for (let i = 0; i < QRCodes.length; i++) {
        if (QRCode === QRCodes[i]['QRCode']) {
            let timeElapsed = Math.floor((currentTime - QRCodes[i]['currentTime']) / 1000);
            // QR Codes are valid only for 600 secs
            if (timeElapsed <= 600) {
                QRCodes[i]['buyerEmail'] = buyerEmail;
                console.log(`QRCode matches, Session updated ${(JSON.stringify(QRCode))} \n`);
                return res.status(200).send('Validated!');
            }
            console.log('Time out error\n');
            return res.status(400).send('Timed out!');
        }
    }
    console.log('Could not find QRCode\n');
    return res.status(400).send('Could not find QRCode');
});


/**
 * Description: Get product details
 * Request:     POST /getProductDetails
 * Send:        JSON object which contains code
 * Receive:     JSON object whcih contains brand, model, description, status, manufacturerName, manufacturerLocation,
 *                                         manufacturerTimestamp, retailerName, retailerLocation, retailerTimestamp
 */
app.post('/getProductDetails',async (req, res) => {
    var myContract=await deploy();
    console.log('Request to /getProductDetails\n');
    let code = req.body.code;
    let QRCode = req.body.QRCode;
    let currentTime = Date.now();         // Date.now() gets the current time in milliseconds
    for (let i = 0; i < QRCodes.length; i++) {
        if (QRCode === QRCodes[i]['QRCode']) {
            let timeElapsed = Math.floor((currentTime - QRCodes[i]['currentTime']) / 1000);
            // QR Codes are valid only for 600 secs
            if (timeElapsed <= 600) {
                let ownedCodeDetails =await  myContract.methods.getOwnedCodeDetails(code);
                let notOwnedCodeDetails =await myContract.methods.getNotOwnedCodeDetails(code);
                if (!ownedCodeDetails || !notOwnedCodeDetails) {
                    return res.status(400).send('Could not retrieve product details.');
                }
                let productDetails = {
                    'brand': notOwnedCodeDetails[0], 'model': notOwnedCodeDetails[1], 'description': notOwnedCodeDetails[2],
                    'status': notOwnedCodeDetails[3], 'manufacturerName': notOwnedCodeDetails[4],
                    'manufacturerLocation': notOwnedCodeDetails[5], 'manufacturerTimestamp': notOwnedCodeDetails[6],
                    'retailerName': ownedCodeDetails[0], 'retailerLocation': ownedCodeDetails[1],
                    'retailerTimestamp': ownedCodeDetails[2]
                };
                console.log('QRCode matched\n');
                return res.status(200).send(JSON.parse(JSON.stringify(productDetails)));
            }
            console.log('Time out error\n');
            return res.status(400).send('Timed out!');
        }
    }
});


/**
 * Description: Seller confirms deal and gets registered as new owner on the Blockchain
 * Request:     POST /sellerConfirm
 * Send:        JSON object which contains email, QRCode, retailer
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/sellerConfirm', async(req, res) => {
    var myContract=await deploy();
    console.log('Request to /sellerConfirm\n');
    let sellerEmail = req.body.email;
    let QRCode = req.body.QRCode;
    let retailer = req.body.retailer;
    console.log(`Email: ${sellerEmail} \n`);
    let currentTime = Date.now();         // Date.now() gets the current time in milliseconds
    let sellerHashedEmail = hashMD5(sellerEmail);
    for (let i = 0; i < QRCodes.length; i++) {
        if (QRCode === QRCodes[i]['QRCode']) {
            let timeElapsed = Math.floor((currentTime - QRCodes[i]['currentTime']) / 1000);
            // QR Codes are valid only for 600 secs
            if (timeElapsed <= 600) {
                QRCodes[i]['confirm'] = '1';
                if(retailer === '1') {
                    QRCodes[i]['retailer'] = '1';
                }
                console.log('Success in sellerConfirm\n');
                return res.status(200).send('Seller confirmed!');
            }
            console.log('Time out error\n');
            return res.status(400).send('Timed out!');
        }
    }
    console.log('Could not find QRCodes\n');
    return res.status(400).send('Could not find QRCodes');
});


/**
 * Description: Buyer confirms deal
 * Request:     POST /buyerConfirm
 * Send:        JSON object which contains email, QRCode
 * Receive:     200 if successful, 400 otherwise
 */
app.post('/buyerConfirm',async (req, res) => {
    var myContract=await deploy();
    console.log('Request made to /buyerConfirm\n');
    let buyerEmail = req.body.email;
    let QRCode = req.body.QRCode;
    let currentTime = Date.now();         // Date.now() gets the current time in milliseconds
    console.log(`Email: ${buyerEmail} and QRCode: ${QRCode} \n`);
    for (let i = 0; i < QRCodes.length; i++) {
        if (QRCode === QRCodes[i]['QRCode']) {
            let timeElapsed = Math.floor((currentTime - QRCodes[i]['currentTime']) / 1000);
            // QR Codes are valid only for 600 secs
            if (timeElapsed <= 600) {
                if(QRCodes[i]['confirm'] === '1'){
                    let hashedSellerEmail = hashMD5(QRCodes[i]['sellerEmail']);
                    let hashedBuyerEmail = hashMD5(QRCodes[i]['buyerEmail']);
                    let code = QRCodes[i]['code'];
                    var ok;
                    if(QRCodes[i]['retailer'] === '1'){
                        console.log('Performing transaction for retailer\n');
                        ok =await myContract.methods.initialOwner(code, hashedSellerEmail, hashedBuyerEmail,
                                                        { from: web3.eth.accounts[0], gas: 3000000 });
                    } else {
                        console.log('Performing transaction for customer\n');
                        ok =await  myContract.methods.changeOwner(code, hashedSellerEmail, hashedBuyerEmail,
                                                        { from: web3.eth.accounts[0], gas: 3000000 });
                    }
                    if (!ok) {
                        return res.status(400).send('Error');
                    }
                    console.log('Success in buyerConfirm, transaction is done!\n');
                    return res.status(200).send('Ok');
                }
                console.log('Buyer has not confirmed\n');
            }
            return res.status(400).send('Timed out!');
        }
    }
    console.log('Product not found\n')
    return res.status(400).send('Product not found');
});

// Function that creates an initial owner for a product
function initialOwner(code, retailerHashedEmail, customerHashedEmail) {
    return myContract.methods.initialOwner(code, retailerHashedEmail, customerHashedEmail,
                                        { from: web3.eth.accounts[0], gas: 3000000 });
}

// Function that creates transfers ownership of a product
function changeOwner(code, oldOwnerHashedEmail, newOwnerHashedEmail) {
    return myContract.methods.changeOwner(code, oldOwnerHashedEmail, newOwnerHashedEmail,
                                        { from: web3.eth.accounts[0], gas: 3000000 });
}


/**
 * Description: Gives product details if the scannee is not the owner of the product
 * Request:     POST /scan
 * Send:        JSON object which contains code
 * Receive:     JSON object which has productDetails
 */
app.post('/scan',async (req, res) => {
    var myContract=await deploy();
    console.log('Request made to /scan\n');
    let code = req.body.code;
    let productDetails = await myContract.methods.getNotOwnedCodeDetails(code);
    let productDetailsObj = {
        'name': productDetails[0], 'model': productDetails[1], 'status': productDetails[2],
        'description': productDetails[3], 'manufacturerName': productDetails[4],
        'manufacturerLocation': productDetails[5], 'manufacturerTimestamp': productDetails[6]
    };
    console.log(`Code ${code} \n`);
    res.status(200).send(JSON.stringify(productDetailsObj));
});


/**
 * Description: Generates QR codes for the manufacturers
 * Request:     POST /QRCodeForManufacturer
 * Send:        JSON object which contains brand, model, status, description, manufacturerName, manufacturerLocation
 * Receive:     200 if QR code was generated, 400 otherwise.
 */
app.post('/QRCodeForManufacturer',async (req, res) => {
    var myContract=await deploy();
    console.log('Request to /QRCodeForManufacturer\n');
    let brand = req.body.brand;
    let model = req.body.model;
    let status = 0;
    let description = req.body.description;
    let manufacturerName = req.body.manufacturerName;
    let manufacturerLocation = req.body.manufacturerLocation;
    let manufacturerTimestamp = new Date();         // Date() gives current timestamp
    manufacturerTimestamp = manufacturerTimestamp.toISOString().slice(0, 10);
    let salt = crypto.randomBytes(20).toString('hex');
    let code = hashMD5(brand + model + status + description + manufacturerName + manufacturerLocation + salt);
    let ok = await myContract.methods.createCode(code,status ,brand, model, description, manufacturerName, manufacturerLocation,
                                        manufacturerTimestamp).send({from: address, gas: 3000000});
    console.log(`Brand: ${brand} \n`);
    if (!ok) {
        return res.status(400).send('ERROR! QR Code for manufacturer could not be generated.');
    }
    console.log(`The QR Code generated is: ${code} \n`);
    let QRcode = code + '\n' + brand + '\n' + model + '\n' + description + '\n' + manufacturerName + '\n' + manufacturerLocation;
    fs.writeFile('views/davidshimjs-qrcodejs-04f46c6/code.txt', QRcode, (err, QRcode) => {
        if (err) {
            console.log(err);
        }
        console.log('Successfully written QR code to file!\n');
    });
    res.sendFile('views/davidshimjs-qrcodejs-04f46c6/index.html', { root: __dirname });
});


/**
 * Description: Gives all the customer details
 * Request:     GET /getCustomerDetails
 * Send:        JSON object which contains email
 * Receive:     JSON object which contains name, phone
 */
app.get('/getCustomerDetails', async(req, res) => {
    console.log('Request to /getCustomerDetails\n');
    var myContract=await deploy();
    let email = req.body.email;
    let hashedEmail = hash(email);
    let customerDetails =await  myContract.methods.getCustomerDetails(hashedEmail);
    console.log(`Email: ${email} \n`);
    let customerDetailsObj = {
        'name': customerDetails[0], 'phone': customerDetails[1]
    };
    res.status(200).send(JSON.parse(JSON.stringify(customerDetailsObj)));
});

// Server start
app.listen(port, (req, res) => {
    console.log(`Listening to port ${port}...\n`);
});