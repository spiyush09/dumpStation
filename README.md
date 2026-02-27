# DumpStation

> A personal tool born out of a simple frustration.

I found myself constantly needing to save files to Google Drive — images, videos, documents, random stuff — and every single time it was the same annoying routine: open Drive, wait for it to load, log in if the session expired, deal with 2FA, navigate to the right folder, upload. Just to save one file.

So I built DumpStation. Open the URL, drop the file, done. No login prompt, no 2FA, no waiting. It just works — every time, from any device, instantly. I have it deployed and running for my own personal use. One-time setup, zero maintenance.

It's a private, minimal web app that uploads files directly to a specific Google Drive folder via a drag-and-drop interface. The auth is set up once and works permanently in the background. You never have to think about it again.

---

## Screenshots

<img width="1865" height="931" alt="Screenshot (229)" src="https://github.com/user-attachments/assets/9302b5bc-958c-45fc-b1b8-2a402788f05b" />

---

## Features

- **Direct-to-Drive Resumable Uploads**: Upload 2GB+ massive files securely. The file goes directly from the browser to Google Drive in chunks, completely bypassing the backend server.
- **Permanent Auth**: Set up OAuth 2.0 once and never log in or deal with 2FA again. Ever.
- **Premium UI**: Sleek dark design with smooth animations and real-time progress bars.
- **Free to Run**: The backend does no heavy lifting so it runs comfortably on free hosting.

---

## 🚀 Setup Guide

### 1. Google Cloud Platform (GCP) Configuration

Google Drive restricts Service Accounts from uploading files to personal drives due to a 0-byte quota limit. To fix this while still maintaining a "login once, work forever" flow, we use **OAuth 2.0 Desktop Authentication**.

Follow these exact steps to configure your GCP project:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "DumpStation").
3. Go to **APIs & Services > Library**, search for **Google Drive API**, and click **Enable**.
4. Go to **APIs & Services > OAuth consent screen**:
   - Choose **External** and hit Create.
   - Fill in the required App name and User support email.
   - Click "Save and Continue" through Scopes.
   - Under **Test users**, add your own personal Google email address (the one with the Drive folder).
   - Click "Save and Continue".
5. Go to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - For Application Type, choose **Desktop app** (this is vital for offline permanent access).
   - Click Create, then click **Download JSON** in the popup.
6. Rename this downloaded file to `oauth_credentials.json` and place it in the root folder of this project.

### 2. Google Drive Folder Setup

1. Open your Google Drive and create a folder named `DumpStation` where you want the files to go.
2. Open that folder and look at the URL. It will look like `https://drive.google.com/drive/u/0/folders/1zOroadRP...`
3. Copy the long ID at the end of the URL (or copy the whole URL, the app will parse it).
4. Create a `.env` file in the root of the project by copying the `.env.example` file, and paste your folder ID or URL.

### 3. Generate the Permanent Token

Run the following setup script in your terminal to generate your permanent refresh token:

```bash
node generate-token.js
```

The script will give you a Google URL. Open it, log in with your Google account, and grant the app permission. It will give you an authorization code. Paste this code back into the terminal.

A `token.json` file will be generated. **You will never have to repeat this step.**

### 4. Run the Server

Start the application:

```bash
npm install
node server.js
```

Open your browser to `http://localhost:3000` and start dropping files!

---

## 🛠️ Troubleshooting: "What if it breaks?"

The core code is highly stable and relies directly on official Google infrastructure, so the architecture will not break.

However, your **Google Authentication Token** could potentially be invalidated by Google if:
- You change your Google Account password.
- You explicitly revoke DumpStation's access in your Google Account Security settings.
- Google forces a security reset.

### The 60-Second Recovery

If the app ever stops working and throws authentication errors in the server logs, recovering it takes less than a minute:

1. **Delete** the `token.json` file inside your project folder.
2. Run the setup script again:
   ```bash
   node generate-token.js
   ```
3. Open the generated link, log in again, and paste the new code into the terminal.
4. Restart your server.

You will **not** need to change your `.env` folder ID or download a new `oauth_credentials.json`.
