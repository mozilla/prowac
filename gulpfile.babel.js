import gulp from 'gulp';
import loadPlugins from 'gulp-load-plugins';
const plugins = loadPlugins({
  lazy: false,
});

gulp.task('lint', () =>
  gulp
  .src(['./*.js', './engine/*.js', './engine/lib/*.js', './tests/**/*.js'])
  .pipe(plugins.eslint())
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failOnError())
);

gulp.task('default', ['lint']);
