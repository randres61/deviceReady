var gulp = require('gulp');
var durandal = require('gulp-durandal');
var webserver = require('gulp-webserver');

gulp.task('build', function () {
    return durandal({
        main: 'main30700.js',
        rjsConfigAdapter: function(rjsConfig) {
            rjsConfig.paths = {
                'breeze': 'empty:'
            };
            rjsConfig.deps = ['text'];
            rjsConfig.generateSourceMaps = false;
            return rjsConfig;
        },
        minify: false
    })
        .pipe(gulp.dest('./release'));
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