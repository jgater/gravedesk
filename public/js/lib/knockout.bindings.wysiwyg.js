    ko.bindingHandlers.wysiwyg = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().wysiwygOptions || {};
        var value = ko.utils.unwrapObservable(valueAccessor());
        var $e = $(element);
        $.extend(true, {
            initialContent : value
        }, options);

        $e.wysiwyg(options);

        //handle the field changing
        function detectFn() {
            var observable = valueAccessor();
            var newvalue = $e.wysiwyg("getContent");
            observable(newvalue);
        }

        var current = $e.wysiwyg('document');
        var timer;
        current.bind({    
            keyup: function(){
                clearTimeout(timer);
                timer = setTimeout(detectFn, 1000);
            }
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $e.wysiwyg('destroy');
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).wysiwyg("setContent", value);
        ko.bindingHandlers.value.update(element, valueAccessor);
    }
};