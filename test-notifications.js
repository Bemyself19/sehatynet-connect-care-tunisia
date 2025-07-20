import http from 'http';

// Test the unread notifications endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/notifications/unread',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODM5ODA4YjEzYjA0NTA0NDkyNjUwNyIsInJvbGUiOiJkb2N0b3IiLCJpYXQiOjE3MzY3NzQ0NDcsImV4cCI6MTczNjg2MDg0N30.R6JVUCo6uFbvdp1MxKMKDJK9nNwLGfRmbV0wQO3V-xw',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error);
});

req.end();
