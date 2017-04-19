module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        simplemocha: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'tap'
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
                separator: '\n',
            },
            dist: {
                src: ['doc/README.header.md', 'doc/api.md', 'doc/README.footer.md'],
                dest: 'README.md'
            }
        }
    });

    grunt.loadNpmTasks('grunt-xo');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('test', ['xo', 'simplemocha']);

    grunt.loadNpmTasks('grunt-jsdoc-to-markdown');
    grunt.registerTask('doc', ['jsdoc2md', 'concat']);
};
