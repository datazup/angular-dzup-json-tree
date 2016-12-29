var app = angular.module('dzupJsonTree');
app.directive('jsonSchemaDirective', ['$compile', '$interpolate', '$dzupConfigUtils', function ($compile, $interpolate, $dzupConfigUtils) {

    var directive = {
        restrict: 'E',
        templateUrl: $dzupConfigUtils.templateUrlBase['dzup-json-tree'] +'/templates/json.schema.template.view.html',
        scope: {
            model: '=',
            isReadOnly: '='
        },
        controller: ['$scope', '$uibModal', function ($scope, $uibModal) {
            $scope.collapsed = true;
            $scope.newProperty = {
                name: '',
                type: ''
            };

            $scope.innerModel = {
                selectedProperty: null,
                properties: {
                    type: 'object',
                    properties: {}
                },
                type: 'object'
            }

            $scope.error = '';
            if ($scope.model) {
                $scope.innerModel.properties = $scope.model;
            }

            $scope.addNewProperty = function () {
                $scope.error = '';
                
                if (!$scope.newProperty.type) {
                    $scope.error = "Property type is not defined";
                    return;
                }
                
                if (!$scope.newProperty.name && $scope.newProperty.type!=='object') {
                    $scope.error = "Property name is not defined";
                    return;
                }
                

                var addTo = $scope.innerModel.properties;
                if ($scope.innerModel.selectedProperty) {
                    if ($scope.innerModel.selectedProperty.type !== 'object' && $scope.innerModel.selectedProperty.type !== 'array') {
                        $scope.error = 'Adding new properties allowed for Objects or Array. Currently selected item is: ' + $scope.innerModel.selectedProperty.type;
                        return;
                    }
                    addTo = $scope.innerModel.selectedProperty; //= $scope.newProperty;
                }

                if ($scope.newProperty.type === 'object') {
                    $scope.newProperty.properties = {};
                } else if ($scope.newProperty.type === 'array') {
                    $scope.newProperty.items = [];
                }

                if (addTo.type === 'object') {
                    addTo.properties[$scope.newProperty['name']] = $scope.newProperty;
                } else if (addTo.type === 'array') {
                    delete $scope.newProperty.name;
                    addTo.items.push($scope.newProperty);
                } else {
                    addTo.properties[$scope.newProperty['name']] = $scope.newProperty;
                }


                $scope.newProperty = {
                    name: '',
                    type: ''
                }

            };




            if (!$scope.isReadOnly) {

                $scope.openModalImport = function () {
                    var modalInstance = $uibModal.open({
                        templateUrl: $dzupConfigUtils.templateUrlBase['dzup-json-tree'] +'/templates/json.schema.modal.import.template.view.html',
                        controller: 'SchemaImportModalController',
                        size: 'md'
                    });

                    modalInstance.result.then(function (importedData) {
                        if (importedData) {
                            $scope.innerModel.properties = importedData;
                        }
                    }, function () {
                        //$log.info('Modal dismissed at: ' + new Date());
                    });
                };

                $scope.advancedSchema = {
                    type: 'object',
                    properties: {
                        properties: {
                            type: 'string',
                            title: 'For advanced user',
                            format: 'ace'
                        }
                    }
                };
                $scope.advancedForm = [{
                    key: 'properties'
                }];

                $scope.advancedInnerModel = {
                    properties: ''
                };
                
                $scope.prepareAdvancedView = function(){
                    if (_.isEmpty($scope.innerModel.properties.properties)){
                        $scope.advancedInnerModel.properties = '';
                    }else{
                        $scope.advancedInnerModel.properties = JSON.stringify($scope.innerModel.properties.properties, null, 2);
                    }
                    
                }
                
                
               $scope.$watch('innerModel.properties.properties', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $scope.prepareAdvancedView();
                        $scope.model = $scope.innerModel.properties;
                    }
                }, true);

                $scope.$watch('advancedInnerModel.properties', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var parsed = null;
                        try {
                            parsed = JSON.parse(newValue);
                        } catch (e) {

                        }
                        if (parsed)
                            $scope.innerModel.properties.properties = parsed;
                    }
                }, true);
            }

            $scope.selectProperty = function (property) {
                $scope.innerModel.selectedProperty = property;
            }
        }]
    };

    return directive;
}]);

app.directive("schemaTree", ['$dzupConfigUtils', function ($dzupConfigUtils) {
    return {
        restrict: 'EA',
        templateUrl: $dzupConfigUtils.templateUrlBase['dzup-json-tree'] +'/templates/json.schema.tree.template.view.html',
        scope: {
            isRoot: '=',
            model: '=',
            isReadOnly: '=',
            doubleClick: '=',
            parentPath: '='
        },
        controller: ['$scope', function ($scope) {

            $scope.onDrop = function ($event, $data, array) {
                /* $scope.createNewItem($data);
                 $scope.collapsed = true;*/
            };

            $scope.dropValidateHandler = function ($drop, $event, $data) {
                /* $scope.collapsed = false;
                 if ($drop.scope.$parent.pipelineItem.actionType && $data.allowedIn) {
                     var indexOf = $data.allowedIn.indexOf($drop.scope.$parent.pipelineItem.actionType);
                     if (indexOf > -1) {
                         return true;
                     }
                 }

                 return false;*/
                return true;
            }
        }]
    }
}]);

app.directive("schemaObjectItem", ['$compile', function ($compile) {
    return {
        restrict: 'E',
        scope: {
            value: '=',
            model: '=',
            index: '=',
            collection: '=',
            isReadOnly: '=',
            doubleClick: '=',
            parentPath: '='
        },
        template: '<div ng-dblclick="doubleClickFn(value)" sglclick="selectProperty(value)" class="schema-item-{{value.type}} schema-item"' +
            'title="{{ value.type || value.description }}" ng-class="{active: value===model.selectedProperty}">' +
            '<span class="first-letter">{{ value.type | firstletter |  capitalize }}</span>' +
            '<span class="splitter"></span>' +
            '<span class="schema-item-title schema-item-title-{{value.type}}"> {{ value.name }} </span>' +
            '<span class="schema-item-remove" ng-if="!isReadOnly" ng-click="removeProperty(value)"><i class="fa fa-times"></i> </span>' +
            '</div>',
        controller: ['$scope', function ($scope) {
            
            $scope.doubleClickFn = function(property){
                console.log('double click prop: '+JSON.stringify(property));
                if ($scope.doubleClick){
                    $scope.doubleClick(property);
                }
            };
            
            $scope.selectProperty = function (property) {
                if (_.isEqual($scope.model.selectedProperty, property)) {
                    $scope.model.selectedProperty = null;
                    //  $scope.showChildren = false;
                } else {
                    $scope.model.selectedProperty = property;
                    // $scope.showChildren = true;
                }
            };
            $scope.index = function () {
                return $scope.index;
            };

            $scope.removeProperty = function (prop) {
                if (_.isArray($scope.collection)) {
                    _.remove($scope.collection, function (value) {
                        if (_.isEqual(value, prop)) {
                            if (_.isEqual($scope.model.selectedProperty, prop)) {
                                $scope.model.selectedProperty = null;
                            }
                            return true;
                        }
                        return false;
                    });
                } else {
                    if (_.isEqual($scope.model.selectedProperty, prop)) {
                        $scope.model.selectedProperty = null;
                    }
                    delete $scope.collection[prop.name];
                }
            };

        }]
    }
}]);

app.directive("schemaObjectFactory", ['$compile', function ($compile) {
    return {
        restrict: 'EA',
        replace: true,
        template: '',
        scope: {
            value: '=',
            model: '=',
            isReadOnly: '=',
            doubleClick: '=',
            parentPath: '='
        },
        controller: ['$scope', function ($scope) {

        }],
        link: function (scope, element, attrs) {
                var tmpl = '';
                tmpl += '<schema-type-' + scope.value.type + ' parent-path="parentPath" double-click="doubleClick" is-read-only="isReadOnly" show-children="showChildren" value="value" model="model"></schema-type-' + scope.value.type + '>';

                var compiled = $compile(tmpl)(scope);
                element.replaceWith(compiled);
            }
    }
}]);

app.directive("schemaTypeObject", ['$dzupConfigUtils', function ($dzupConfigUtils) {
    return {
        restrict: 'EA',
        replace: true,
        /*require: '^schema-object-factory',*/
        transclude: true,
        scope: {
            value: '=',
            model: '=',
            isReadOnly: '=',
            doubleClick: '=',
            parentPath: '='
        },
        controller: ['$scope', function ($scope) {

        }],
        templateUrl: $dzupConfigUtils.templateUrlBase['dzup-json-tree'] +'/templates/json.schema.type.object.template.view.html'
    }
}]);

app.directive("schemaTypeArray", ['$dzupConfigUtils', function ($dzupConfigUtils) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: {
            value: '=',
            model: '=',
            isReadOnly: '=',
            doubleClick: '=',
            parentPath: '='
        },
        templateUrl: $dzupConfigUtils.templateUrlBase['dzup-json-tree'] +'/templates/json.schema.type.array.template.view.html'
    }
}]);

app.directive("schemaTypeString", ['$dzupConfigUtils', function ($dzupConfigUtils) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: {
            value: '=',
            model: '=',
            doubleClick: '=',
            parentPath: '='
        },
        template: ''
    }
}]);

app.directive("schemaTypeBoolean", ['$dzupConfigUtils', function ($dzupConfigUtils) {
    return {
        restrict: 'EA',
        replace: true,
        /*require: '^schema-object-factory',*/
        transclude: true,
        scope: {
            value: '=',
            model: '=',
            doubleClick: '=',
            parentPath: '='
        },
        template: ''
    }
}]);

app.directive("schemaTypeNumber", ['$dzupConfigUtils', function ($dzupConfigUtils) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: {
            value: '=',
            model: '=',
            doubleClick: '=',
            parentPath: '='
        },
        template: ''
    }
}]);

app.controller("SchemaImportModalController", ['$scope', '$uibModalInstance', 'JsonSchemaUtilService', function ($scope, $uibModalInstance, JsonSchemaUtilService) {

    $scope.uploadInfo = {
        type: null
    };

    $scope.jsonSchema = null;

    $scope.uploadFile = function () {
        $scope.error = '';
        if (!$scope.fileToUpload) {
            $scope.error = 'Please select file to upload';
            return;
        };
        if (!$scope.uploadInfo.type) {
            $scope.error = 'Please select type';
            return;
        };

        var reader = new FileReader();
        reader.onload = function (loadEvent) {
            $scope.$apply(function () {
                $scope.jsonSchema = JsonSchemaUtilService.toJsonSchema(loadEvent.target.result, $scope.uploadInfo.type);
            });
        }
        reader.readAsText($scope.fileToUpload);

    };

    $scope.setFiles = function (element) {
        $scope.$apply(function (scope) {
            scope.fileToUpload = element.files[0];
        });
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.jsonSchema);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}]);
