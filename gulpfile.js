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
                presets: ['es2015'],
                plugins: [
                    require('babel-plugin-transform-object-rest-spread'),
                    require('babel-plugin-transform-class-properties'),
                    require('babel-plugin-transform-async-to-generator'),
                    require('babel-plugin-transform-runtime'),
                ]
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
                presets: ['es2015'],
                plugins: [
                    require('babel-plugin-transform-object-rest-spread'),
                    require('babel-plugin-transform-class-properties'),
                    require('babel-plugin-transform-async-to-generator'),
                ]
            }),
            uglify(),
            gulp.dest('lib')],
        cb);
});

gulp.task('build', ['server', 'client']);