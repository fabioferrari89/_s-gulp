import {
  src,
  dest,
  watch,
  series,
  parallel
} from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import named from 'vinyl-named';
import browserSync from "browser-sync";
import zip from "gulp-zip";
import info from "./package.json";
import replace from "gulp-replace";
import wpPot from "gulp-wp-pot";
// Upload
var ftp = require( 'vinyl-ftp' );
var gutil = require( 'gulp-util' );

var cfg = require('./gulpconfig.json');
var deployOption = cfg.deployOption;

var rename = require('gulp-rename');
var pug = require('gulp-pug'),
  pugPHPFilter = require('pug-php-filter');

const PRODUCTION = yargs.argv.prod;
const server = browserSync.create();
export const serve = done => {
  server.init(cfg.browserSyncOptions);
  done();
};
export const reload = done => {
  server.reload();
  done();
};
export const clean = () => del(['dist', 'bundled']);

export const styles = () => {
  return src(['sass/style.scss'])
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, postcss([autoprefixer])))
    .pipe(gulpif(PRODUCTION, cleanCss({
      compatibility: 'ie8'
    })))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(dest('./'))
    .pipe(server.stream());
}
export const images = () => {
  return src('images/**/*.{jpg,jpeg,png,svg,gif}')
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(dest('dist-images'));
}
export const copy = () => {
  return src([
      "**/*",
      // 'script/main.js',
      "!pug{,/**}",
      '!{images,js,sass}',
      '!{images,js,sass}/**/*',
      "!node_modules{,/**}",
      "!bundled{,/**}",
      "!.babelrc",
      "!.gitignore",
      "!gulpfile.babel.js",
      "!package.json",
      "!package-lock.json",
      "!TODO",
      "!Icon",
    ])
    .pipe(dest('dist'));
}
export const scripts = () => {
  return src(['js/main.js'])
    .pipe(named())
    .pipe(webpack({
      module: {
        rules: [{
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: []
            }
          }
        }]
      },
      mode: PRODUCTION ? 'production' : 'development',
      devtool: !PRODUCTION ? 'inline-source-map' : false,
      output: {
        filename: '[name].js'
      },
      // externals: {
      //   jquery: 'jQuery'
      // },
    }))
    .pipe(dest('script'))
}
export const views = () => {
  return src('./pug/**/*.pug')
    .pipe(pug({
      pretty: "\t",
      filters: {
        php: pugPHPFilter
      }
    }))
    .pipe(rename(function (path) {
      path.extname = ".php"
    }))
    .pipe(dest('./'));
};
export const compress = () => {
  return src([
      "**/*",
      "!pug{,/**}",
      '!{images,js,sass}',
      '!{images,js,sass}/**/*',
      "!node_modules{,/**}",
      "!bundled{,/**}",
      "!.babelrc",
      "!.gitignore",
      "!gulpfile.babel.js",
      "!package.json",
      "!package-lock.json",
      "!TODO",
      "!Icon",
      "!dist{,/**}",
    ])
    .pipe(
      gulpif(
        file => file.relative.split(".").pop() !== "zip",
        replace("_themename", info.name)
      )
    )
    .pipe(zip(`${info.name}.zip`))
    .pipe(dest('bundled'));
};
export const pot = () => {
  return src("**/*.php")
    .pipe(
      wpPot({
        domain: "_themename",
        package: info.name
      })
    )
    .pipe(dest(`languages/${info.name}.pot`));
};
export const watchForChanges = () => {
  watch('sass/**/*.scss', series(styles, reload));
  watch('images/**/*.{jpg,jpeg,png,svg,gif}', series(images, reload));
  watch(['!{images,js,sass}', '!{images,js,sass}/**/*'], series(copy, reload));
  watch(['js/**/*.js'], series(scripts, reload));
  watch('pug/**/*.pug', series(views, reload));
//   watch("**/*.php", reload);
}

export const deploy = () => {
  var conn = ftp.create( {
    host:     deployOption.host,
    user:     deployOption.user,
    password: deployOption.password,
    parallel: 10,
    log:      gutil.log
  } );

  var globs = [
    'dist/**'
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return src( globs )
    .pipe( conn.newer( deployOption.path ) ) // only upload newer files
    .pipe( conn.dest( deployOption.path ) );
}


export const dev = series(clean, parallel(styles, images, scripts), views, serve, watchForChanges);
// export const build = series(clean, parallel(styles, images, scripts), views, copy, pot, deploy);
export const build = series(clean, parallel(styles, images, scripts), views, copy, pot, compress);
export const upload = deploy;
export default dev;
