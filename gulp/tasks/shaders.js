var changed = require('gulp-changed');
var gulp = require('gulp');
var config = require('../config').shaders;
var browserSync = require('browser-sync');

var taskDef = function () {
    return gulp.src(config.src)
        .pipe(changed(config.dest)) // Ignore unchanged files
        .pipe(gulp.dest(config.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
};

module.exports = taskDef;

gulp.task('shaders', taskDef);
