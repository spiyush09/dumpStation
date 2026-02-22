const fs = require('fs');
const { google } = require('googleapis');

let FOLDER_ID = process.env.DRIVE_FOLDER_ID;
if (FOLDER_ID && FOLDER_ID.includes('folders/')) {
    const match = FOLDER_ID.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) FOLDER_ID = match[1];
}

async function getResumableUploadUrl(filename, mimeType, size, origin = 'http://localhost:3000') {
    if (!FOLDER_ID) {
        throw new Error('DRIVE_FOLDER_ID is not set in environment variables');
    }

    try {
        // Read from env vars (for deployment) or fall back to local files (for local dev)
        let credentials, token;

        if (process.env.OAUTH_CREDENTIALS) {
            credentials = JSON.parse(process.env.OAUTH_CREDENTIALS);
        } else {
            credentials = JSON.parse(fs.readFileSync('oauth_credentials.json'));
        }

        if (process.env.OAUTH_TOKEN) {
            token = JSON.parse(process.env.OAUTH_TOKEN);
        } else {
            token = JSON.parse(fs.readFileSync('token.json'));
        }

        const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
        const redirect_uri = redirect_uris ? redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob';
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
        oAuth2Client.setCredentials(token);

        const response = await oAuth2Client.request({
            url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
            method: 'POST',
            headers: {
                'X-Upload-Content-Type': mimeType,
                'X-Upload-Content-Length': size,
                'Content-Type': 'application/json; charset=UTF-8',
                'Origin': origin
            },
            data: {
                name: filename,
                parents: [FOLDER_ID]
            }
        });

        let uploadUrl = null;
        if (response.headers) {
            if (typeof response.headers.get === 'function') {
                uploadUrl = response.headers.get('location') || response.headers.get('Location');
            } else {
                uploadUrl = response.headers.location || response.headers.Location;
            }
        }

        if (uploadUrl) {
            return uploadUrl;
        } else {
            throw new Error('Did not receive upload location from Google Drive API');
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error('Missing oauth_credentials.json or token.json. Please run "node generate-token.js" first.');
        }
        console.error('--- DRIVE API ERROR ---', err.message);
        if (err.response && err.response.data) {
            console.error('Response Data:', err.response.data);
        }
        throw err;
    }
}

module.exports = { getResumableUploadUrl };