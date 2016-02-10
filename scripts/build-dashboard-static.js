import { default as shelljs } from 'shelljs';

shelljs.mkdir('-p', 'dist/dashboard');
shelljs.cp('-r', './dashboard/static/*', 'dist/dashboard');
