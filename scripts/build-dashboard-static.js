require('shelljs/global');

mkdir('-p', 'dist/dashboard');
cp('-r', './dashboard/static/*', 'dist/dashboard');
