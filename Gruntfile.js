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
        jsdoc : {
            dist : {
                src: ['lib/*.js', 'test/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.registerTask('test', ['simplemocha']);

    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.registerTask('doc', ['jsdoc']);

};