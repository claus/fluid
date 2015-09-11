var gulp = require('gulp');

gulp.task('production', ['images', 'shaders', 'minifyCss', 'uglifyJs']);
