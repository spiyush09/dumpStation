const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadList = document.getElementById('upload-list');

// Drag and drop event listeners
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) { dropZone.classList.add('highlight'); }
function unhighlight(e) { dropZone.classList.remove('highlight'); }

// Handle drops and clicks
dropZone.addEventListener('drop', handleDrop, false);
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', function () { handleFiles(this.files); });

function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFiles(files) {
    [...files].forEach(uploadFile);
}

function createProgressUI(id, filename) {
    const item = document.createElement('div');
    item.className = 'upload-item';
    item.id = `upload-${id}`;

    item.innerHTML = `
        <div class="item-header">
            <span class="filename" title="${filename}">${filename}</span>
            <span class="status" id="status-${id}">STARTING</span>
        </div>
        <div class="progress-container">
            <div class="progress-bar" id="progress-${id}"></div>
        </div>
    `;

    uploadList.prepend(item);
}

function updateProgressUI(id, percent, isComplete = false, errorMsg = null) {
    const progressBar = document.getElementById(`progress-${id}`);
    const statusText = document.getElementById(`status-${id}`);

    if (progressBar) progressBar.style.width = `${percent}%`;

    if (statusText) {
        if (errorMsg) {
            statusText.textContent = errorMsg;
            statusText.className = 'status error';
            if (progressBar) progressBar.style.background = '#ef4444';
        } else if (isComplete) {
            statusText.textContent = 'DONE';
            statusText.className = 'status success';
            setTimeout(() => {
                const item = document.getElementById(`upload-${id}`);
                if (item) {
                    item.style.opacity = '0';
                    setTimeout(() => item.remove(), 500);
                }
            }, 3000); // Remove successful items after 3s
        } else {
            statusText.textContent = `${percent}%`;
        }
    }
}

async function uploadFile(file) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    createProgressUI(id, file.name);

    try {
        // Step 1: Request Resumable Upload URL from our Backend
        const res = await fetch('/api/get-upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Server error generating upload URL');
        }

        const { uploadUrl } = await res.json();

        // Step 2: Upload file DIRECTLY to Google Drive (circumventing our Node backend)
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                updateProgressUI(id, percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                updateProgressUI(id, 100, true);
            } else {
                updateProgressUI(id, 0, false, `Drive Error: ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            updateProgressUI(id, 0, false, 'Network error during Drive upload');
        };

        xhr.send(file);
    } catch (err) {
        updateProgressUI(id, 0, false, err.message);
    }
}
