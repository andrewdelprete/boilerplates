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
var html = require('html-browserify');

gulp.task('browser-sync', ['build'], function() {
  browserSync({
    server: {
       baseDir: "./dist"
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
  return gulp.src('src/angular/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format());
});

// Browserify
gulp.task('browserify', ['lint'], function () {
    return browserify({
        debug: true,
        entries: ['src/angular/app.js' ],
        extensions: ['.js' ]
    })
    .transform(html)
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
    //.pipe(streamify(uglify()))
    .pipe(gulp.dest('dist/scripts/'))
    .pipe(browserSync.reload({stream:true}))
});

// Html
gulp.task('html', function() {
  return gulp.src('./index.html')
      .pipe(gulp.dest('dist'))
      .pipe(browserSync.reload({stream:true}));
});

gulp.task('build', ['styles', 'browserify', 'html']);

gulp.task('default', ['browser-sync'], function(){
  gulp.watch("src/styles/**/*.scss", ['styles']);
  gulp.watch(["src/angular/**/*.js", "src/angular/**/*.html"], ['browserify']);
  gulp.watch("*.html", ['html']);
});
