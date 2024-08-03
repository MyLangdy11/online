document.addEventListener('DOMContentLoaded', () => {
  const savedUsername = localStorage.getItem('username');
  const savedPassword = localStorage.getItem('password');
  if (savedUsername && savedPassword) {
    document.getElementById('username').value = savedUsername;
    document.getElementById('password').value = savedPassword;
    login(true);
  }
});

function toggleLessons(courseElement) {
  const lessons = courseElement.querySelector('.lessons');
  if (lessons.style.display === 'none') {
    lessons.style.display = 'block';
  } else {
    lessons.style.display = 'none';
  }
}

function login(isAutoLogin = false) {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const spreadsheetId = '1VoqMndYpOQv6a_ZrUSWciLNEv1WWB0Fmkp4laHBt-Cw';
  const rangeUsers = 'Users!A2:B';
  const rangeCourses = 'Courses!A2:C';
  const apiKey = 'AIzaSyBlN7d0VWpUrUiLjw4co4INU2pCEYLgzh0';

  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUsers}?key=${apiKey}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const users = data.values;
      const user = users.find(user => user[0] === username && user[1] === password);
      const messageElement = document.getElementById('message');
      if (user) {
        messageElement.style.color = 'green';
        messageElement.textContent = 'Login successful!';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('logout-button').style.display = 'block';

        if (!isAutoLogin) {
          localStorage.setItem('username', username);
          localStorage.setItem('password', password);
        }

        // Fetch purchased courses
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeCourses}?key=${apiKey}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(courseData => {
            const coursePurchases = courseData.values;
            const userCourses = coursePurchases.filter(row => row[0] === username && row[2] === 'TRUE');
            const purchasedCourseCodes = userCourses.map(row => row[1]);

            // Enable play buttons for purchased courses
            document.querySelectorAll('.course').forEach(courseElement => {
              const courseCode = courseElement.getAttribute('data-course-code');
              if (purchasedCourseCodes.includes(courseCode)) {
                courseElement.querySelectorAll('.play-button').forEach(button => {
                  button.disabled = false;
                  button.classList.add('enabled');
                });
              }
            });

            // Fetch and update video links
            fetchVideoLinks(spreadsheetId, apiKey);
          })
          .catch(error => {
            console.error('Error fetching course data:', error);
          });
      } else {
        messageElement.style.color = 'red';
        messageElement.textContent = 'Incorrect username or password';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      const messageElement = document.getElementById('message');
      messageElement.style.color = 'red';
      messageElement.textContent = 'An error occurred. Please try again.';
    });
}

function fetchVideoLinks(spreadsheetId, apiKey) {
  const rangeVideos = 'Videos!A2:C'; // Adjust the range as needed

  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeVideos}?key=${apiKey}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(videoData => {
      const videos = videoData.values;
      document.querySelectorAll('.course').forEach(courseElement => {
        const courseCode = courseElement.getAttribute('data-course-code');
        const courseVideos = videos.filter(video => video[0] === courseCode);

        courseElement.querySelectorAll('.lesson').forEach((lessonElement, index) => {
          const video = courseVideos[index];
          if (video) {
            const iframe = lessonElement.querySelector('iframe');
            iframe.src = video[2]; // Assuming the video URL is in the third column
          }
        });
      });
    })
    .catch(error => {
      console.error('Error fetching video links:', error);
    });
}

function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('password');
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('logout-button').style.display = 'none';
}