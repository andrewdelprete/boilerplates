var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');

gulp.task('browser-sync', ['build'], function() {
  browserSync({
    server: {
       baseDir: "./"
    }
  });
});

gulp.task('bs-reload', function () {
  browserSync.reload();
});


gulp.task('styles', function(){
  gulp.src(['src/styles/**/*.scss'])
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(sass())
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest('dist/styles/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/styles/'))
    .pipe(browserSync.reload({stream:true}))
});

// Eslint
gulp.task('lint', function() {
  return gulp.src('src/scripts/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format());
});

// Browserify
gulp.task('browserify', ['lint'], function () {
    return browserify({
        debug: true,
        entries: ['src/scripts/app.js' ]
    })
    .transform(babelify)
    .bundle()
    .pipe(source('app.js'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(gulp.dest('dist/scripts/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(streamify(uglify({ mangle: true })))
    .pipe(gulp.dest('dist/scripts/'))
    .pipe(browserSync.reload({stream:true}))
});

gulp.task('build', ['styles', 'browserify']);

gulp.task('default', ['browser-sync'], function(){
  gulp.watch("src/styles/**/*.scss", ['styles']);
  gulp.watch("src/scripts/**/*.js", ['browserify']);
  gulp.watch("*.html", ['bs-reload']);
});