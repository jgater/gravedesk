function SimpleViewModelController() {
	var self = this;
	self.topbarView = new TopBarViewModel();
		Sammy(function() {-
		this.get('/#adminlogin', function() { 
				$(function() {
					$('#adminloginModal').modal({
						backdrop : true
					})
					$('#adminloginModal').modal('show');
					$("input[type='text']:first", document.forms[0]).focus();
				});
		}); 	
	}).run();
}
