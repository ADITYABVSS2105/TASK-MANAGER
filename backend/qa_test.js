const http = require('http');

async function testAPI() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('--- STARTING QA API TESTS ---');

  const req = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      if (token) options.headers['Authorization'] = `Bearer ${token}`;
      
      const request = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      request.on('error', reject);
      if (body) request.write(JSON.stringify(body));
      request.end();
    });
  };

  try {
    // 1. Signup
    console.log('1. Testing Signup (Valid)');
    const email = `qa_${Date.now()}@test.com`;
    let res = await req('POST', '/auth/signup', { name: 'QA Tester', email, password: 'password123' });
    console.log(`Status: ${res.status}`);
    const token = res.data.token;

    console.log('\n2. Testing Signup (Duplicate)');
    res = await req('POST', '/auth/signup', { name: 'QA Tester', email, password: 'password123' });
    console.log(`Status: ${res.status} | Msg: ${res.data.message}`);

    console.log('\n3. Testing Login (Correct)');
    res = await req('POST', '/auth/login', { email, password: 'password123' });
    console.log(`Status: ${res.status}`);

    console.log('\n4. Testing Login (Incorrect)');
    res = await req('POST', '/auth/login', { email, password: 'wrongpass' });
    console.log(`Status: ${res.status} | Msg: ${res.data.message}`);

    // Task Management
    console.log('\n5. Testing Create Task');
    res = await req('POST', '/tasks', { title: 'QA Task', priority: 'High' }, token);
    if (!res.data.task) throw new Error('Create Task Failed: ' + JSON.stringify(res.data));
    console.log(`Status: ${res.status} | Task: ${res.data.task.title}`);
    const taskId = res.data.task._id;

    console.log('\n6. Testing Get Tasks');
    res = await req('GET', '/tasks', null, token);
    console.log(`Status: ${res.status} | Count: ${res.data.count}`);

    console.log('\n7. Testing Update Task');
    res = await req('PUT', `/tasks/${taskId}`, { title: 'QA Task', status: 'Completed' }, token);
    if (!res.data.task) throw new Error('Update Task Failed: ' + JSON.stringify(res.data));
    console.log(`Status: ${res.status} | Status: ${res.data.task.status}`);

    console.log('\n8. Testing Analytics');
    res = await req('GET', '/tasks/analytics', null, token);
    console.log(`Status: ${res.status} | Total: ${res.data.summary.total}`);

    console.log('\n9. Testing Delete Task');
    res = await req('DELETE', `/tasks/${taskId}`, null, token);
    console.log(`Status: ${res.status}`);

    console.log('\n--- TESTS COMPLETED ---');
  } catch (err) {
    console.error('Test script error:', err);
  }
}

testAPI();
