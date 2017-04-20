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
                command: 'node_modules/.bin/nyc node_modules/.bin/mocha tests/*.js && node_modules/.bin/nyc report --reporter=text-lcov | node_modules/.bin/coveralls --force'
            },
            purgebadges: {
                command: 'curl -X PURGE https://camo.githubusercontent.com/5f0b98e5bf126b3906fffae4072d89aa79bbc65d/68747470733a2f2f62616467652e667572792e696f2f6a732f62696e7270632e737667 ; curl -X PURGE https://camo.githubusercontent.com/a554890f3c5ef62df1a95c58135b5e2fe82ad381/68747470733a2f2f636f766572616c6c732e696f2f7265706f732f6769746875622f686f6262797175616b65722f62696e7270632f62616467652e7376673f6272616e63683d6d6173746572 ; curl -X PURGE https://camo.githubusercontent.com/1634c087285b3ef4930287325ae07bce5329515a/68747470733a2f2f7472617669732d63692e6f72672f686f6262797175616b65722f62696e7270632e7376673f6272616e63683d6d6173746572 ; curl -X PURGE https://camo.githubusercontent.com/7622a087fe96b8f6dd6739bfedb0f866740b9f65/68747470733a2f2f696d672e736869656c64732e696f2f67656d6e617369756d2f686f6262797175616b65722f62696e7270632e7376673f6d61784167653d32353932303030'
            }
        }
    });

    grunt.loadNpmTasks('grunt-xo');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('test', ['xo', 'shell:coveralls', 'simplemocha', 'shell:purgebadges']);

    grunt.loadNpmTasks('grunt-jsdoc-to-markdown');
    grunt.registerTask('doc', ['jsdoc2md', 'concat']);
};
