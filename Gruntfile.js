module.exports = function(grunt) {
	var libIncludeOrder_minified = [
		'source/public/lib/jquery/jquery.min.js',
		'source/public/lib/backbone/underscore-min.js',
		'source/public/lib/backbone/backbone-min.js',
		'source/public/lib/handlebars/handlebars.js',
		'source/public/lib/F/F.min.js',
		'source/public/lib/FastClick/FastClick.js',
		'source/public/lib/smoothie/smoothie.js',
		'source/public/lib/modernizr/modernizr.js'
	];

	var libIncludeOrder = [
		'source/public/lib/jquery/jquery.js',
		'source/public/lib/backbone/underscore.js',
		'source/public/lib/backbone/backbone.js',
		'source/public/lib/handlebars/handlebars.js',
		'source/public/lib/F/F.js',
		'source/public/lib/FastClick/FastClick.js',
		'source/public/lib/smoothie/smoothie.js',
		'source/public/lib/modernizr/modernizr.js'
	];

	var includeOrder = [
		'source/public/pc/pc.js',
		'temp/pc.Partials.js',
		'temp/pc.Templates.js',

		'source/public/pc/pc.util.js',

		'source/public/pc/Models/*.js',
		'source/public/pc/Collections/*.js',

		'source/public/pc/Components/pc.Router.js',

		'source/public/pc/Components/pc.Graph.js',

		'source/public/pc/Components/pc.App.js',
		'source/public/pc/Components/pc.Actions.js',
		'source/public/pc/Components/pc.Stats.js'
	];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build: 'build/'
		},
		concat: {
			pc: {
				src: includeOrder,
				dest: 'build/public/pc/pc.js'
			},
			pc_lib: {
				src: libIncludeOrder,
				dest: 'build/public/pc/pc.lib.js'
			}
		},
		copy: {
			server: {
				expand: true,
				cwd: 'source/',
				src: ['**'],
				dest: 'build/'
			}
		},
		jshint: {
			files: [ 'Gruntfile.js', 'source/**/*.js', '!source/public/lib/**/*' ],
			options: {
				globals: {
					eqeqeq: true
				}
			}
		},
		handlebars: {
			templates: {
				options: {
					namespace: "pc.Templates",
					processName: function(path) {
						return path.split('/').pop().split('.').shift();
					}
				},
				files: {
					'temp/pc.Templates.js': 'source/templates/*.hbs'
				}
			},
			partials: {
				options: {
					namespace: 'pc.Templates',
					partialRegex: /.*/,
					processPartialName: function(path) {
						return path.split('/').pop().split('.').shift();
					}
				},
				files: {
					'temp/pc.Partials.js': 'source/templates/*.hbs'
				}
			}
		},
		watch: {
			js: {
				files: [ 'Gruntfile.js', 'source/**/*.js', '!source/public/lib/**/*' ],
				tasks: [ 'jshint', 'copy', 'concat' ]
			},
			html: {
				files: [ 'source/public/*.html', 'source/public/pc/Styles/*.css' ],
				tasks: [ 'copy', 'concat' ]
			},
			hbs: {
				files: [ 'source/templates/*.hbs' ],
				tasks: [ 'handlebars', 'concat' ]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-handlebars');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	
	grunt.registerTask('default', [ 'jshint', 'copy', 'handlebars', 'concat' ]);
};
