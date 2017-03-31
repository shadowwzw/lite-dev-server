const gulp = require('gulp');
const pump = require('pump');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');

gulp.task('build', cb => {
  pump([
      gulp.src('src/*.js'),
      eslint(),
      eslint.format(),
      eslint.failAfterError(),
      babel({
        presets: ['es2015'],
        plugins: [
          require('babel-plugin-transform-object-rest-spread'),
          require('babel-plugin-transform-class-properties'),
          require('babel-plugin-transform-async-to-generator'),
          require('babel-plugin-transform-runtime'),
        ]
      }),
      gulpif('client.js', uglify()),
      gulp.dest('lib')],
    cb);
});