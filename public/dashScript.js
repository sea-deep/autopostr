document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        if (!data.loggedIn) {
            window.location.assign('/');
        }
        document.querySelector('.add-task').style.display = 'block';
        updateTasks();
    } catch (error) {
        console.error('Error fetching auth status:', error);
    }
});

async function addTask(event) {
    if (event) event.preventDefault();

    const button = document.getElementById('create-task-btn');
    const driveURL = document.getElementById('folder-url').value.trim();
    const dailyLimit = parseInt(document.getElementById('video-count').value.trim(), 10);
    const folderFeedback = document.getElementById('folder-url-feedback');
    const countFeedback = document.getElementById('video-count-feedback');
    const title = document.getElementById('video-title').value.trim();
    const description = document.getElementById('video-desc').value.trim();
    const tagsInput = document.getElementById('video-tags');
    const tags = (tagsInput.value === "") ? [] : tagsInput.value.trim().split(',');
    folderFeedback.classList.remove('active');
    countFeedback.classList.remove('active');

    let hasError = false;


    if (!driveURL.includes('drive.google.com/drive/folders/')) {
        folderFeedback.textContent = 'Please enter a valid Google Drive folder URL';
        folderFeedback.classList.add('active');
        hasError = true;
    }

    // Validation for daily limit
    if (isNaN(dailyLimit) || dailyLimit <= 0 || dailyLimit > 5) {
        countFeedback.textContent = 'Please enter a daily limit between 1 and 5.';
        countFeedback.classList.add('active');
        hasError = true;
    }


    if (hasError) return;
    button.textContent = 'Creating...';
    button.disabled = true;
    // Creats task object
    const task = {
        taskID: `${Date.now() + Math.floor(Math.random() * 1000)}`,
        driveURL: driveURL,
        nextUploadTime: new Date(Date.now() + 60000),
        dailyLimit: dailyLimit,
        totalUploaded: 0,
        todayUploaded: 0,
        title: title,
        description: description,
        tags: tags
    };

    try {
        const response = await fetch('/api/addtask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Task added:', data.tasks);
            updateTasks();
            closeForm();
        } else {
            console.log('Error adding task:', data.error || 'Unknown error');
            folderFeedback.textContent = data.error || 'Error adding task. Please try again.';
            folderFeedback.classList.add('active');
        }
    } catch (error) {
        console.error('Network or other error:', error);
        folderFeedback.textContent = 'An error occurred while adding the task. Please try again.';
        folderFeedback.classList.add('active');
    }
}




async function updateTasks() {
    const response = await fetch('/api/viewtasks');
    const data = await response.json();

    const taskList = document.getElementById('task-listitems');
    taskList.innerHTML = '';

    if (data.tasks && data.tasks.length > 0) {
        data.tasks.forEach(task => {
            const listItem = document.createElement('li');

            listItem.innerHTML = `
                <p><strong>Task ID: </strong> ${task.taskID}</p>
                <p><strong>Google Drive URL:</strong> <a href="${task.driveURL}" target="_blank">Click here to redirect</a></p>
                <p><strong>Video Title:</strong> ${task.title}</p>
                <p><strong>Daily Limit:</strong> ${task.dailyLimit}</p>
                <p><strong>Today's Uploads:</strong> ${task.todayUploaded}</p>
                <p><strong>Total Uploads:</strong> ${task.totalUploaded}</p>
                <p><strong>Next Upload Time:</strong> ${new Date(task.nextUploadTime).toLocaleString()}</p>
                <button class="task-action" id="${task.taskID}" onclick="removeTask('${task.taskID}')">Remove Task</button>
               `;

            taskList.appendChild(listItem);
        });
    } else {
        taskList.innerHTML = '<li>No tasks available</li>';
    }
}

async function removeTask(taskID) {
    const button = document.getElementById(taskID);
    button.textContent = 'Removing...';
    button.disabled = true;
    await fetch('/api/deletetask', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskID }),
    });
    updateTasks();
}
function openForm() {
    const dialog = document.getElementById('taskDialog');
    dialog.classList.remove('hidden');
    document.body.classList.add('no-scroll');
}

function closeForm(event) {
    if (event) event.preventDefault();
    const dialog = document.getElementById('taskDialog');
    dialog.classList.add('hidden');
    document.body.classList.remove('no-scroll');

    const form = document.getElementById('task-form');
    form.reset();

    const feedbackElements = form.querySelectorAll('.feedback');
    feedbackElements.forEach(feedback => {
        feedback.textContent = '';
    });
    const addTaskButton = document.getElementById('create-task-btn');
    addTaskButton.disabled = false; 
    addTaskButton.textContent = 'Add Task'; 

}
