const express = require('express');
const cors = require('cors');
const qr = require('qr-image');
const vCard = require('vcard-generator');
const Jimp = require('jimp');

const app = express();
const port = 3000;
// Enable CORS
app.use(cors());

app.use(express.json());

// Function to generate QR code
function generateQR(vcardData) {
    return qr.imageSync(vcardData, { type: 'png' });
}

// Function to generate vCard data
function generateVCard({ firstname, lastname, middlename, email, phone }) {
    return vCard.generate({
        name: {
            familyName: lastname,
            givenName: firstname,
            middleName: middlename,
        },
        emails: [{
            type: 'work',
            text: email,
        }],
        phones: [{
            type: 'work',
            text: phone,
        }],
    });
}

// Function to generate QR code with logo
async function generateQRWithLogo(vcardData) {
    try {
        // Generate QR code
        const qrCodeBuffer = generateQR(vcardData);

        // Load logo image
        const logo = await Jimp.read('logo.jpeg'); 

        // Load QR code image
        const qrCodeImage = await Jimp.read(qrCodeBuffer);

        // Calculate position to center the logo
        const centerX = (qrCodeImage.bitmap.width - logo.bitmap.width) / 2;
        const centerY = (qrCodeImage.bitmap.height - logo.bitmap.height) / 2;

        // Compose images
        qrCodeImage.composite(logo, centerX, centerY);

        // Convert image to buffer
        const qrCodeWithLogoBuffer = await new Promise((resolve, reject) => {
            qrCodeImage.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(buffer);
                }
            });
        });

        // Convert buffer to data URL
        const qrCodeWithLogo = `data:image/png;base64,${qrCodeWithLogoBuffer.toString('base64')}`;

        return qrCodeWithLogo;
    } catch (error) {
        console.error('Error generating QR code with logo:', error);
        throw error;
    }
}


app.get('/', (req, res) => { 
    res.send('Hello, Azure! This is a Node.js application.'); 
  }); 

app.post('/generate_qr', async (req, res) => {
    try {
        const { firstname, lastname, middlename, email, phone } = req.body;

        // Generate vCard data
        const vcard = generateVCard({ firstname, lastname, middlename, email, phone });

        // Generate QR code with logo
        const qrCodeWithLogo = await generateQRWithLogo(vcard);

        //res.send({ qrCode: qrCodeWithLogo });
        // Set response content type to PNG image
        res.contentType('image/png');

        // Send the PNG image data directly
        res.send(Buffer.from(qrCodeWithLogo.split(',')[1], 'base64'));
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

/*
const express = require('express');
const qr = require('qrcode');
const vCard = require('vcard-generator');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/generate_qr', async (req, res) => {
  try {
    const { firstname, lastname, middlename, email, phone } = req.body;

    // Generate vCard data
    const vcard = vCard.generate({
      name: {
        familyName: lastname,
        givenName: firstname,
        middleName: middlename,
        //prefix: 'Dr.',
        //suffix: 'Jr.',
      },
      emails: [{
        type: 'work',
        text: email,
      }, 
      
    ],
    phones: [{
      type: 'work',
      text: phone,
    }
    
    ],
  });

  // Generate QR code
  const qrCode = await qr.toDataURL(vcard);

  res.send({ qrCode });
} catch (error) {
  console.error(error);
  res.status(500).send({ error: 'Internal Server Error' });
}
});

app.listen(port, () => {
console.log(`Server listening at http://localhost:${port}`);
});*/