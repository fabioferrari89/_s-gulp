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

var cfg = require('./gulpconfig.json');
var paths = cfg.paths;

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
    .pipe(dest('dist/images'));
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
export const compress = () => {
  return src([
      "**/*",
      "!pug{,/**}",
      "!node_modules{,/**}",
      "!bundled{,/**}",
      "!.babelrc",
      "!.gitignore",
      "!gulpfile.babel.js",
      "!package.json",
      "!package-lock.json",
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
  watch('sass/**/*.scss', styles);
  watch('images/**/*.{jpg,jpeg,png,svg,gif}', series(images, reload));
  watch(['!{images,js,sass}', '!{images,js,sass}/**/*'], series(copy, reload));
  watch(['js/**/*.js', '!js/main.js'], series(scripts, reload));
  watch("**/*.php", reload);
}
export const dev = series(clean, parallel(styles, images, scripts), serve, watchForChanges);
// export const build = series(clean, parallel(styles, images, scripts), copy, pot, compress);
export const build = series(clean, parallel(styles, images, scripts), copy, pot);
export default dev;