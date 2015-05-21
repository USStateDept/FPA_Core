var gulp = require('gulp');
var del = require('del');

var stylus = require('gulp-stylus');
var jade = require('gulp-jade');

//var coffee = require('gulp-coffee');
//var uglify = require('gulp-uglify');
//var minifycss = require('gulp-minify-css');
//var minifyhtml = require('gulp-minify-html');
//var imagemin = require('gulp-imagemin');
//var autoprefixer = require('gulp-autoprefixer');


//var browserSync = require('browser-sync');
//creates the shortcuts to be able to access gulp plugins as plugins.uglify etc

var gulpLoadPlugins = require('gulp-load-plugins');

// gulpLoadPlugins({
//     rename: {
//         'gulp-minify-css': 'minifycss',
//         'gulp-minify-html': 'minifyhtml'
//     }
// });

// gulpLoadPlugins({
//     pattern: ['gulp-*', 'gulp.*'], // the glob(s) to search for
//     config: 'package.json', // where to find the plugins, by default  searched up from process.cwd()
//     scope: ['dependencies', 'devDependencies', 'peerDependencies'], // which keys in the config to look within
//     replaceString: /^gulp(-|\.)/, // what to remove from the name of the module when adding it to the context
//     camelize: true, // if true, transforms hyphenated plugins names to camel case
//     lazy: true, // whether the plugins should be lazy loaded on demand
//     rename: {} // a mapping of plugins to rename
// });

var plugins = require('gulp-load-plugins')();

var app_dir = {
    src: __dirname + "/src/",
    tests: __dirname + "/tests/",
    dist: __dirname + "/dist/",
    css: "**/*.css",
    js: "app/**/*.js",
    images: "app/images",
    html: "**/*.htm"
};

//Default gulp task
gulp.task('default', function() {
    console.log(app_dir.src);
    // place code for your default task here
});

//gulp dist-delete
gulp.task('dist-delete', function(cb) {
    console.log(">>>>>>>> deleting");
    del([app_dir.dist + '**'], cb)
});


/*********CLean copy************/

gulp.task('dist-copy-clean', function() {
    console.log(">>>>>>>> cleaning up the dist folder");
    //ignore jade, styl, and css inside the js folder
    return gulp.src([app_dir.src + '**', '!' + app_dir.src + '**/*.jade', '!' + app_dir.src + '**/*.styl', '!' + app_dir.src + 'app/js/*.css'])
        .pipe(gulp.dest(app_dir.dist))
});


/** minify**/

gulp.task('dist-minify-css', function() {
    console.log("minifying CSS");
    return gulp.src(app_dir.dist + app_dir.css)
        .pipe(plugins.minifyCss())
        .pipe(gulp.dest(app_dir.dist))
});

gulp.task('dist-uglify-js', function() {
    console.log(">>>>>>>> Uglifying JS");
    return gulp.src(app_dir.dist + app_dir.js)
        .pipe(plugins.uglify())
        .pipe(gulp.dest(app_dir.dist))
});

gulp.task('dist-minify-html', function() {
    console.log(">>>>>>>> Minifying HTML");
    var opts = {
        comments: true,
        spare: true
    };
    return gulp.src(app_dir.src + app_dir.html)
        .pipe(plugins.minifyHtml(opts))
        .pipe(gulp.dest(app_dir.dist))
});

gulp.task('dist-minify-image', function() {
    console.log(">>>>>>>> Minifying Images");
    return gulp.src(app_dir.src + app_dir.images + "/**/*")
        .pipe(plugins.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(app_dir.dist + app_dir.images))
});

// gulp.task('dist-compile-coffee', function() {
//     console.log(">>>>>>>> Compile Coffeescript");
//     return gulp.src(app_dir.tests + "**/*.coffee") // path to your file
//         .pipe(coffee())
//         .pipe(gulp.dest(app_dir.tests));
// });

//gulp.task('dist-minify', ['dist-minify-css', 'dist-uglify-js', 'dist-minify-html', 'dist-minify-image']);
gulp.task('dist-minify', ['dist-minify-css', 'dist-uglify-js', 'dist-minify-html', 'dist-minify-image']);



/*********Watch************/



gulp.task('compile-jade', function() {
    return gulp.src(app_dir.src + '**/*.jade')
        .pipe(plugins.jade({
            pretty: true
        }))
        .pipe(gulp.dest(app_dir.src))
});

gulp.task('compile-stylus', function() {
    console.log("COMPILING");
    return gulp.src(app_dir.src + '**/*.styl')
        .pipe(plugins.stylus({
            errors: true,
            pretty: true
        }))
        .pipe(gulp.dest(app_dir.src))
});

gulp.task('autoprefix-css', ['compile-stylus'], function() {
    console.log("AUTO PREFIXING");
    return gulp.src(app_dir.src + '**/*.css')
        .pipe(plugins.autoprefixer(["last 2 versions"], {
            cascade: true
        }))
        .pipe(gulp.dest(app_dir.src))
});

gulp.task('watch', function() {
    // watch jade and style
    gulp.watch(app_dir.src + '**/*.jade', ['compile-jade']);
    gulp.watch(app_dir.src + '**/*.styl', ['autoprefix-css']);
});