module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        simplemocha: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd'
            },
            all: { src: ['tests/*.js'] }
        },
        xo: {
             target: ['lib/*']
        },
        jsdoc2md: {
            oneOutputFile: {
                src: 'lib/*.js',
                dest: 'doc/api.md'
            }
        },
        concat: {
            options: {
                separator: '\n'
            },
            dist: {
                src: ['doc/README.header.md', 'doc/api.md', 'doc/README.footer.md'],
                dest: 'README.md'
            }
        },
        shell: {
            coveralls: {
                command: 'node_modules/.bin/nyc node_modules/.bin/mocha tests/*.js && node_modules/.bin/nyc report --reporter=text-lcov | node_modules/.bin/coveralls'
            }
        }
    });

    grunt.loadNpmTasks('grunt-xo');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-coveralls');
    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('test', ['xo', 'simplemocha']);

    grunt.loadNpmTasks('grunt-jsdoc-to-markdown');
    grunt.registerTask('doc', ['jsdoc2md', 'concat']);
};
