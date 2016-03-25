var fs = require('fs')
var gulp = require('gulp')
var gutil = require('gulp-util')
var concat = require('gulp-concat')
var jsdoc2md = require('gulp-jsdoc-to-markdown')
var standard = require('gulp-standard')

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
