import { default as shelljs } from 'shelljs';

shelljs.mkdir('-p', 'dist/dashboard');
shelljs.cp('-rf', './dashboard/static/*', 'dist/dashboard/static');
