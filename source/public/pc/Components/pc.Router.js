pc.Router = Backbone.Router.extend({
	// Define the valid routes that our application will respond to
    routes: {
		"*path": "showComponent"
    },
	
	/*
	Given the assumption that we've designed our component hierarchy to match our
	hash path, find the component that should be shown according to the hash path
	*/
	showComponent: function(path) {
		// Get each folder in the hash path
		var hashParts = path.split('/');
		
		// Starting with our app, drill into the hierarchy to find the component
		// that matches the hash path
		var component = pc.app;
		_.some(hashParts, function(part) {
			if (component[part]) {
				component = component[part];

				// Show each component along the way
				component.show();
			}
			else {
				console.warn('pc.Router: route specifies an invalid part: %s', path);
				return true;
			}
		});
		
		// Show the component if it has a show() method
		if (component && component.show) {
			component.show();
		}
		else {
			console.warn('pc.Router: ended up at a component with no show method: %s', path);
		}
	}
});
