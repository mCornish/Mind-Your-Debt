const opts = { stdio: 'inherit', shell: true };
if (process.env.NODE_ENV === 'production') require('child_process').spawn('npm', ['run', 'prod-server'], opts);
else require('child_process').spawn('npm', ['run', 'dev-server'], opts);