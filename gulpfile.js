
var gulp = require('gulp');

var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var minify = require('gulp-minify-css');
var newer = require('gulp-newer');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');


// Compile CSS, Autoprefix
gulp.task('styles', function() {
  return gulp.src('sass/styles.scss')
    .pipe(newer('sass/*.scss')).on('error', errorHandler)
    .pipe(sass({ style: 'expanded' }))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minify())
    .pipe(gulp.dest('build/css'))
    .pipe(notify({ message: "CSS tasks complete" }));
});

// Lint, Concatenate and Minify JavaScript
gulp.task('scripts', function() {
  return gulp.src(['js/jquery-1.11.1.min.js', 'js/scripts.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('scripts.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('build/js'))
    .pipe(notify({ message: "Scripts tasks complete" }));
});

// Compress images
var imgDest = 'build/img';
gulp.task('images', function() {
    return gulp.src('img/*')
      .pipe(newer(imgDest)).on('error', errorHandler)
      .pipe(imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        })).on('error', errorHandler)
      .pipe(gulp.dest(imgDest));
});


// Fonts
gulp.task('fonts', function() {
    return gulp.src('fonts/*')
      .pipe(gulp.dest('build/fonts'));
});

// Watch 
gulp.task('watch', function() {
    gulp.watch('js/**/*.js', ['scripts']);
    gulp.watch('sass/**/*.scss', ['styles']);
    gulp.watch('fonts/*', ['fonts']);
    gulp.watch('img/**/*', ['images']);
});


// Default Task
gulp.task('default', function() {
    gulp.start('styles', 'scripts', 'fonts', 'images', 'watch');
});

// Handle the error
function errorHandler (error) {
    console.log(error.toString());
    this.emit('end');
}