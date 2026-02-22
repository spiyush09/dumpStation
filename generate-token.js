const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('oauth_credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file. Make sure you downloaded your OAuth 2.0 Client ID JSON file and saved it as oauth_credentials.json in the project folder.', err.message);

    const credentials = JSON.parse(content);
    // Works with both web and installed (desktop) credentials
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob');

    getAccessToken(oAuth2Client);
});

function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Forces it to return a permanent refresh token
    });
    console.log('\n====================================');
    console.log('    PERMANENT AUTHORIZATION SETUP    ');
    console.log('====================================\n');
    console.log('1. Open this exact URL in your browser and log in to your Google Account (the same one that has the DumpStation folder):');
    console.log('\n' + authUrl + '\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('2. Paste the authorization code here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);

            // Store the token to disk for persistent usage
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('\n[SUCCESS] Token permanently stored to', TOKEN_PATH);
                console.log('You will NEVER need to log in again. You can now start DumpStation using: node server.js');
            });
        });
    });
}
