const gulp = require('gulp');
const pump = require('pump');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

gulp.task('server', cb => {
    pump([
            gulp.src('src/server.js'),
            eslint(),
            eslint.format(),
            eslint.failAfterError(),
            babel({
                presets: ['es2015']
            }),
            gulp.dest('lib')],
        cb);
});

gulp.task('client', cb => {
    pump([
            gulp.src('src/client.js'),
            eslint(),
            eslint.format(),
            eslint.failAfterError(),
            babel({
                presets: ['es2015']
            }),
            uglify(),
            gulp.dest('lib')],
        cb);
});

gulp.task('prepublish', ['server', 'client']);