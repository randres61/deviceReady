var gulp = require('gulp'),
    durandal = require('gulp-durandal'),
    webserver = require('gulp-webserver'),
    zip = require('gulp-zip');

gulp.task('minify', function () {
    return durandal({
        main: 'main.js',
        rjsConfigAdapter: function(rjsConfig) {
            rjsConfig.paths = {
                'breeze': 'empty:'
            };
            rjsConfig.deps = ['text'];
            rjsConfig.generateSourceMaps = false;
            return rjsConfig;
        },
        minify: false
    }).pipe(gulp.dest('./build/www/app'));
});

 
gulp.task('server', function() {
  gulp.src('.')
    .pipe(webserver({
        port:9000,
        livereload: true,
        directoryListing: false,
        fallback:"index.html",
        open: true
    }));
});

gulp.task('zip', ['minify'], function() {
    return gulp.src('./build/www/**/*.*').pipe(zip('www.zip')).pipe(gulp.dest('./build/version'));
});

gulp.task('build', ['minify', 'zip']); 