/**
* A KnockoutJs binding handler for jquery sliders              
*/

ko.bindingHandlers.slideVisible = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        // First get the latest data that we're bound to
        var value = valueAccessor(), allBindings = allBindingsAccessor();
         
        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.utils.unwrapObservable(value); 
         
        // Grab some more data from another binding property
        var duration = allBindings.slideDuration || 200; // 400ms is default duration unless otherwise specified
         
        // Now manipulate the DOM element
        if (valueUnwrapped == true) 
            $(element).slideDown(duration); // Make the element visible
        else
            $(element).slideUp(duration);   // Make the element invisible
    }
};

/**
* A KnockoutJs binding handler for adding/removing css classes        
*/

ko.bindingHandlers['class'] = {
    'update': function(element, valueAccessor) {
        if (element['__ko__previousClassValue__']) {
            $(element).removeClass(element['__ko__previousClassValue__']);
        }
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).addClass(value);
        element['__ko__previousClassValue__'] = value;
    }
};

/**
* A KnockoutJs binding handler for the jwysiwyg editor               
*/

ko.bindingHandlers.wysiwyg = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().wysiwygOptions || {css : '/css/editor.css' };
        var value = ko.utils.unwrapObservable(valueAccessor());
        var $e = $(element);
        $.extend(true, {
            initialContent : value
        }, options);

        $e.wysiwyg(options);
        var current = $e.wysiwyg('document');

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

/**
* A KnockoutJs binding handler for the html tables javascript library DataTables.                  
*/
ko.bindingHandlers['dataTable'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if ($.data(element, isInitialisedKey) === true)
            return;

        var binding = ko.utils.unwrapObservable(valueAccessor());
        var isInitialisedKey = "ko.bindingHandlers.dataTable.isInitialised";
        var options = {"sPaginationType": "bootstrap", "sDom": "<'pull-left'l><f><t><'pull-left'p><'pull-right'i>", "oLanguage": {"sLengthMenu": "_MENU_ rows per page"} };
        // ** Initialise the DataTables options object with the data-bind settings **

        // Clone the options object found in the data bindings.  This object will form the base for the DataTable initialisation object.
        if (binding.options)
            options = $.extend(options, binding.options);

        // Define the tables columns.
        if (binding.columns && binding.columns.length) {
            options.aoColumns = [];
            ko.utils.arrayForEach(binding.columns, function (col) {
                options.aoColumns.push({ mDataProp: col });
            })
        }

        // Register the row template to be used with the DataTable.
        if (binding.rowTemplate && binding.rowTemplate != '') {
            options.fnRowCallback = function (row, data, displayIndex, displayIndexFull) {
                // Render the row template for this row.
                ko.renderTemplate(binding.rowTemplate, data, null, row, "replaceChildren");
                // custom addclick on row function!
                $(row).unbind('click').bind('click', function() {
                 location.href='/manage#/'+data.id;
                });
                return row;
            }
        }

        // Set the data source of the DataTable.
        if (binding.dataSource) {
            var dataSource = ko.utils.unwrapObservable(binding.dataSource);

            // If the data source is a function that gets the data for us...
            if (typeof dataSource == 'function' && dataSource.length == 2) {
                // Register a fnServerData callback which calls the data source function when the DataTable requires data.
                options.fnServerData = function (source, criteria, callback) {
                    dataSource(ko.bindingHandlers['dataTable'].convertDataCriteria(criteria), function (result) {
                        callback({
                            aaData: ko.utils.unwrapObservable(result.Data),
                            iTotalRecords: ko.utils.unwrapObservable(result.TotalRecords),
                            iTotalDisplayRecords: ko.utils.unwrapObservable(result.DisplayedRecords)
                        });
                    });
                }

                // In this data source scenario, we are relying on the server processing.
                options.bProcessing = true;
                options.bServerSide = true;
            }
            // If the data source is a javascript array...
            else if (dataSource instanceof Array) {
                // Set the initial datasource of the table.
                options.aaData = ko.utils.unwrapObservable(binding.dataSource);

                // If the data source is a knockout observable array...
                if (ko.isObservable(binding.dataSource)) {
                    // Subscribe to the dataSource observable.  This callback will fire whenever items are added to 
                    // and removed from the data source.
                    binding.dataSource.subscribe(function (newItems) {
                        // ** Redraw table **
                        var dataTable = $(element).dataTable();
                        // Get a list of rows in the DataTable.
                        var tableNodes = dataTable.fnGetNodes();
                        // If the table contains rows...
                        if (tableNodes.length) {
                            // Unregister each of the table rows from knockout.
                            ko.utils.arrayForEach(tableNodes, function (node) { ko.cleanNode(node); });
                            // Clear the datatable of rows.
                            dataTable.fnClearTable();
                        }

                        // Unwrap the items in the data source if required.
                        var unwrappedItems = [];
                        ko.utils.arrayForEach(newItems, function (item) {
                            unwrappedItems.push(ko.utils.unwrapObservable(item));
                        });

                        // Add the new data back into the data table.
                        dataTable.fnAddData(unwrappedItems);
                    });
                }


            }
            // If the dataSource was not a function that retrieves data, or a javascript object array containing data.
            else {
                throw 'The dataSource defined must either be a javascript object array, or a function that takes special parameters.';
            }
        }

        // If no fnRowCallback has been registered in the DataTable's options, then register the default fnRowCallback.
        // This default fnRowCallback function is called for every row in the data source.  The intention of this callback
        // is to build a table row that is bound it's associated record in the data source via knockout js.
        if (!options.fnRowCallback) {
            options.fnRowCallback = function (row, srcData, displayIndex, displayIndexFull) {
                var columns = this.fnSettings().aoColumns

                // Empty the row that has been build by the DataTable of any child elements.
                var destRow = $(row);
                destRow.empty();
                // custom addclick on row function!
                //destRow.click( function() {location = 'manage/' + srcData.id} );
                // For each column in the data table...
                ko.utils.arrayForEach(columns, function (column) {
                    var columnName = column.mDataProp;
                    // Create a new cell.
                    var newCell = $("<td></td>");
                    // Insert the cell in the current row.
                    destRow.append(newCell);
                    // bind the cell to the observable in the current data row.
                    var accesor = eval("srcData['" + columnName.replace(".", "']['") + "']");
                    ko.applyBindingsToNode(newCell[0], { text: accesor }, srcData);
                });

                return destRow[0];
            }
        }

        $(element).dataTable(options);
        $.data(element, isInitialisedKey, true);


        // Tell knockout that the control rendered by this binding is capable of managing the binding of it's descendent elements.
        // This is crutial, otherwise knockout will attempt to rebind elements that have been printed by the row template.
        return { controlsDescendantBindings: true };
    }
};