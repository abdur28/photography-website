const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const fs = require('fs');
const mongoose = require("mongoose");
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const axios = require('axios');
const Redis = require('redis');
const compression = require('compression');
require('dotenv').config();

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set up Redis client
const redisClient = Redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD // If authentication is enabled
});

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());

const clientID = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const refreshToken = process.env.REFRESH_TOKEN
const tokenType = process.env.TOKEN_TYPE
const accountId = process.env.ACCOUNT_ID
const accountUsername = process.env.ACCOUNT_USERNAME
const mongoDBURL = process.env.MONGODB_URI

let accessToken = null;
let tokenLastFetchedTime = null;
const TOKEN_EXPIRY_DURATION_MS = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds

async function fetchAccessToken(clientId, clientSecret) {
    try {
        const response = await axios.post('https://api.imgur.com/oauth2/token', {
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token'
        });
        
        if (response.data && response.data.access_token) {
            accessToken = response.data.access_token;
            tokenLastFetchedTime = Date.now();
            console.log('Access token fetched successfully.');
        } else {
            console.error('Failed to fetch access token from Imgur API.');
        }
    } catch (error) {
        console.error('Error fetching access token:', error);
    }
}

async function ensureToken(req, res, next) {
    try {
        if (!accessToken || !tokenLastFetchedTime || (Date.now() - tokenLastFetchedTime) > TOKEN_EXPIRY_DURATION_MS) {
            console.log('Access token expired or not available. Fetching new token...');
            await fetchAccessToken(clientID, clientSecret);
        }
        console.log('Token checked, proceeding...');
        next();
    } catch (error) {
        console.error('Error in ensureToken middleware:', error);
        res.redirect('/');
    }
}



// Fetch images from Imgur API and cache the result
async function fetchAndCacheImages(albumHash) {
    try {
        const cachedImages = await getFromCache(albumHash);
        if (cachedImages) {
            console.log(`Images for album ${albumHash} fetched from cache`);
            return JSON.parse(cachedImages);
        }

        // Fetch images from Imgur API
        const response = await axios.get(`https://api.imgur.com/3/account/abdur28/album/${albumHash}`, {
            headers: {
                'Authorization': `Client-ID ${clientID}`
            }
        });

        const albumData = response.data.data.images;
        const albumImageUrls = albumData.map(image => ({
            link: image.link,
            id: image.id
        }));

        // Cache fetched images in Redis with a TTL of 3600 seconds (1 hour)
        await setInCacheWithExpiration(albumHash, JSON.stringify(albumImageUrls), 3600);

        console.log(`Images for album ${albumHash} fetched from API and cached`);
        return albumImageUrls;
    } catch (error) {
        console.error(`Error fetching images for album ${albumHash}:`, error);
        return null;
    }
}

// Retrieve a value from the Redis cache
async function getFromCache(key) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}

// Set a value in the Redis cache
async function setInCache(key, value) {
    return new Promise((resolve, reject) => {
        redisClient.set(key, value, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}

// Set a value in the Redis cache with expiration
async function setInCacheWithExpiration(key, value, seconds) {
    return new Promise((resolve, reject) => {
        redisClient.setex(key, seconds, value, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}
async function clearCache() {
    return new Promise((resolve, reject) => {
        redisClient.flushdb((err, succeeded) => {
            if (err) {
                reject(err);
            } else {
                console.log('Cache cleared successfully');
                resolve();
            }
        });
    });
}






const albumHashes = [{
    name: 'photoshoots',
    hash: 'jwn4DPl'
}, {
    name: 'graduation',
    hash: 'LXNraCR'
}, {
    name: 'pregnancy',
    hash: 'hzyo7Fn'
}, {
    name: 'family',
    hash: '7AbOjou'
}, {
    name: 'creative',
    hash: 'GrnEXll'
}, {
    name: 'children',
    hash: 'PFDlB2A'
}, {
    name: 'event',
    hash: 'ShX8W9o'
}, {
    name: 'wedding',
    hash: 'RZVXrPP'
}];

const contachHash = 'DhgDWQS';
const aboutMeHash = 'cpEEnIy';

mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.mongoDBURL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

const informationSchema = new mongoose.Schema({
    name: String,
    email: String,
    number: String,
    address: String,
    instagram: String,
    twitter: String,
    telegram: String,
    facebook: String,
    aboutMeInfo: String,
    bio: String,
});

const Information = mongoose.model('Information', informationSchema);

const fetchAdminInfo = async (req, res, next) => {
    try {
        const adminInfo = await Information.findOne();
        res.locals.adminInfo = adminInfo;
        next();
    } catch (error) {
        console.error('Error fetching admin information:', error);
        res.status(500).send('Internal Server Error');
    }
};

app.use(fetchAdminInfo);




app.get('/',ensureToken, async (req, res) => {
    try {
        const albumPromises = albumHashes.map(async album => {
            const images = await fetchAndCacheImages(album.hash);
            return { name: album.name, images };
        });

        const albums = await Promise.all(albumPromises);

        const images = albums.reduce((acc, curr) => {
            return acc.concat(curr.images.map(image => image.link));
        }, []);

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        const shuffledImages = shuffleArray(images);

        res.render('index', { albums, myImages: shuffledImages, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

app.get('/contact', async (req, res) => {
    try {
        const response = await axios.get(`https://api.imgur.com/3/account/abdur28/album/${contachHash}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = response.data.data.images;
        const imageUrls = data.map(image => image.link);

        res.render('contact', { images: imageUrls, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

app.get('/about-me', async (req, res) => {
    try {
        const response = await axios.get(`https://api.imgur.com/3/account/abdur28/album/${aboutMeHash}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = response.data.data.images;
        const imageUrls = data.map(image => image.link);

        res.render('about_me', { images: imageUrls, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

app.get('/gallery', ensureToken, async (req, res) => {
    try {
        const albumPromises = albumHashes.map(async album => {
            const images = await fetchAndCacheImages(album.hash);
            return { name: album.name, images };
        });

        const albums = await Promise.all(albumPromises);

        res.render('gallery', { albums });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});


app.get('/iamtheowner01-admin', function (req, res) {
    res.render('admin', { adminInfo: res.locals.adminInfo });
});

app.post('/iamtheowner01-admin', async (req, res) => {
    try {
        const { address, number, email, instagram, twitter, telegram, facebook, aboutMeInfo, bio } = req.body;
        const { adminInfo } = res.locals;

        adminInfo.address = address.trim() || adminInfo.address;
        adminInfo.number = number.trim() || adminInfo.number;
        adminInfo.email = email.trim() || adminInfo.email;
        adminInfo.instagram = instagram.trim() || adminInfo.instagram;
        adminInfo.twitter = twitter.trim() || adminInfo.twitter;
        adminInfo.telegram = telegram.trim() || adminInfo.telegram;
        adminInfo.facebook = facebook.trim() || adminInfo.facebook;
        adminInfo.aboutMeInfo = aboutMeInfo.trim() || adminInfo.aboutMeInfo;
        adminInfo.bio = bio.trim() || adminInfo.bio;

        await adminInfo.save();

        res.redirect('/')
    } catch (error) {
        console.error('Error updating admin information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/iamtheowner01-admin-gallery-edit', ensureToken, async (req, res) => {
    try {
        clearCache();
        const albumPromises = albumHashes.map(async album => {
            const images = await fetchAndCacheImages(album.hash);
            return { name: album.name, images, albumHash: album.hash };
        });

        const albums = await Promise.all(albumPromises);

        const contactResponse = await axios.get(`https://api.imgur.com/3/account/abdur28/album/${contachHash}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const aboutMeResponse = await axios.get(`https://api.imgur.com/3/account/abdur28/album/${aboutMeHash}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const aboutMeData = aboutMeResponse.data.data.images
        const aboutMeImageUrls = aboutMeData.map(image => image.link);
        const aboutMeImage = { hash: aboutMeHash, images: aboutMeImageUrls }

        const contactData = contactResponse.data.data.images
        const contantImageUrls = contactData.map(image => image.link);
        const contactImage = { hash: contachHash, images: contantImageUrls }

        res.render('gallery_edit', { albums, contactImage, aboutMeImage, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

app.delete('/delete-image/:imageId', async (req, res) => {
    const { imageId } = req.params;

    try {
        const response = await axios.delete(`https://api.imgur.com/3/image/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.data.success) {
            console.log('Image deleted successfully');
            clearCache()
            res.sendStatus(200);
        } else {
            console.error('Failed to delete image:', response.data.data.error);
            res.sendStatus(500);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.sendStatus(500);
    }
});

app.post('/add-image', upload.single('image'), async (req, res) => {
    console.log(req.file);
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const resizedBuffer = await sharp(file.buffer).toBuffer();
        const blob = new Blob([resizedBuffer], { type: 'image/jpeg' });
        const albumHash = req.body.album;
        const formData = new FormData();
        formData.append('image', blob, { filename: file.originalname });
        formData.append('album', albumHash);

        const config = {
            method: 'post',
            url: 'https://api.imgur.com/3/upload',
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary}`
            },
            data: formData
        };

        const response = await axios(config);

        if (response.status !== 200 || !response.data || !response.data.success) {
            return res.status(500).json({ error: 'Failed to upload image to Imgur' });
        }

        clearCache()
        console.log("uploaded") 
        const imageUrl = response.data.data.link;
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    });
});

