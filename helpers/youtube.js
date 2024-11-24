const { google } = require('googleapis');
const { PassThrough } = require('stream');


async function uploadVideo(user, task) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const folderUrl = task.driveURL;
    const videoIndex = task.totalUploaded;
    const folderId = extractDriveFolderId(folderUrl);

    try {
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const res = await drive.files.list({
            q: `'${folderId}' in parents and mimeType='video/mp4'`,
            fields: 'files(id, name)',
            orderBy: 'name',
            pageSize: 10,
        });

        if (res.data.files.length === 0) {
            console.log('No videos found in the folder.');
            return task;
        }

        const videoFile = res.data.files[videoIndex];
        if (!videoFile) {
            console.log('No video found at the current index.');
            return null;
        }

        const videoFileId = videoFile.id;
        const videoFileName = videoFile.name.split('.').slice(0, -1).join('.');

        // For params
        let newIndex = videoIndex + 1;
        let title = (task.title === "") ? videoFileName : task.title.replaceAll(":filename:", videoFileName).replaceAll(':vidindex:', newIndex);
        let description = (task.description === "") ? '' : task.description.replaceAll(":filename:", videoFileName).replaceAll(':vidindex:', newIndex);
        console.log(`Downloading video: ${videoFileName}`);
        const vid = await googleDriveDownload(drive, videoFileId);
        console.log("Uploading video:\n", title, "\n",
            description, "\n",
            task.tags);
        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: formatTitle(title),
                    description: description,
                    tags: task.tags
                },
                status: {
                    privacyStatus: 'public',
                },
            },
            media: {
                body: vid,
            },
        });

        task.totalUploaded += 1;
        task.todayUploaded += 1;
        task.nextUploadTime = calculateNextUploadTime(task.dailyLimit); // Recalculate the next upload time

        console.log(`Video uploaded successfully- Video URL: https://youtu.be/${response.data.id}`);
        return task;
    } catch (error) {
        console.error('Error uploading video:', error);
        return task;
    }
}

async function googleDriveDownload(drive, fileId) {
    const downloadStream = new PassThrough();

    try {
        const res = await drive.files.get({
            fileId: fileId,
            alt: 'media',
        }, { responseType: 'stream' });

        res.data
            .on('end', () => {
                console.log(`Download complete`);
            })
            .on('error', (err) => {
                console.error('Error downloading file:', err);
            })
            .pipe(downloadStream);
    } catch (error) {
        console.error('Error downloading from Google Drive:', error);
    }

    return downloadStream;
}

function extractDriveFolderId(url) {
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function calculateNextUploadTime(videosPerDay) {
    const interval = (24 * 60) / videosPerDay; // Base interval in minutes
    const randomFactor = 0.75 + Math.random() * 1.5; // Random factor between 0.75 and 2.25
    const adjustedInterval = interval * randomFactor; // Adjust interval randomly
    return new Date(Date.now() + adjustedInterval * 60 * 1000); // Convert to milliseconds
}


module.exports = { uploadVideo };


function formatTitle(title) {
    let formattedTitle = title.replace(/_/g, ' ');
    if (formattedTitle.length > 100) {
        formattedTitle = formattedTitle.slice(0, 100);
    }
    return formattedTitle;
}
