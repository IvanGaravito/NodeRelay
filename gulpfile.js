var fs = require('fs')
var gulp = require('gulp')
var gutil = require('gulp-util')
var concat = require('gulp-concat')
var coveralls = require('gulp-coveralls')
var istanbul = require('gulp-istanbul')
var jsdoc2md = require('gulp-jsdoc-to-markdown')
var mocha = require('gulp-mocha')
var standard = require('gulp-standard')

gulp.task('coverage', function () {
  return gulp.src(['./index.js', 'lib/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
})

gulp.task('coveralls', function () {
  gulp.src('./coverage/lcov.info')
    .pipe(coveralls())
})

gulp.task('docs', function () {
  gulp.src(['index.js', 'lib/**/*.js'])
    .pipe(concat('README.md'))
    .pipe(jsdoc2md({
      template: fs.readFileSync('./jsdoc2md/README.hbs', 'utf8')
    })
    .on('error', gutil.log))
    .pipe(gulp.dest('.'))
})

gulp.task('standard', function () {
  return gulp.src(['./index.js', 'lib/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('test', ['standard', 'coverage'], function () {
  gulp.src('test/**/*.js')
    .pipe(mocha())
    .pipe(istanbul.writeReports())
    // .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
})
