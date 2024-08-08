require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const dns = require('dns');
const urlHeader = require('url');
const promisify = require('util').promisify;
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({extended:true}))

const urls = {};

const shortenUrl = () => {
  let  shortId;
  do {
    shortId = crypto.randomBytes(2).toString('hex');
  } while (urls[shortId]);
  return shortId;
}

const validUrl = async (link) => {
  const dnsPromise = promisify(dns.lookup);
  try {
    const parsedUrl = new urlHeader.URL(link);
    const host = parsedUrl.hostname;
    await dnsPromise(host);
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
};

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  
  const {url} = req.body;
  if (!url)
    return res.json({error:'url Missing'});

  if (! await validUrl(url))
    return res.json({ error: 'invalid url' });

  const short = shortenUrl ();
  urls[short] = url;
  return res.json({ original_url : url, short_url : short});
});

app.get('/api/shorturl/:short', (req, res) =>{
  const {short} = req.params;
  const path = urls[short];
  res.redirect(path);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
