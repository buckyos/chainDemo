const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require('gulp-sourcemaps');
const tsProject = ts.createProject("tsconfig.json");
const fs = require("fs-extra");

// 任务：编译
// 编译src/目录下的代码到dist/目录
gulp.task("compile", function() {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist/"));
});

// 任务：拷贝资源
// 其他需要拷贝到dist目录的非代码文件,
// 可以在这里加,调用npm run build会拷贝到dist
gulp.task("res", () => {
    [
        gulp.src([
            "./src/**/*.json"
        ])
        .pipe(gulp.dest("./dist/")),
    ];
});

// 任务：构建全部
gulp.task("build", [
    "compile", "res"
]);
