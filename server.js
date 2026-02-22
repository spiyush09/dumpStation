require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getResumableUploadUrl } = require('./googleDriveService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/get-upload-url', async (req, res) => {
    try {
        const { filename, mimeType, size } = req.body;
        if (!filename || !mimeType || !size) {
            return res.status(400).json({ error: 'Missing required file metadata' });
        }

        const origin = req.headers.origin || req.protocol + '://' + req.get('host');
        const uploadUrl = await getResumableUploadUrl(filename, mimeType, size, origin);
        res.json({ uploadUrl });
    } catch (error) {
        console.error('Error getting upload URL:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
