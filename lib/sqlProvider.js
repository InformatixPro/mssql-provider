var _sql = require('mssql');

var SqlProvider = function(settings) { 
    this._settings = settings; 
};

SqlProvider.prototype.GetProcName = function(table, action) {
    return 'usp_' + table + '_' + action;
};

SqlProvider.prototype.Exec = function(sproc, parameters, callback) {
    console.dir(parameters);
    _sql.connect(this._settings.config, function(err) {
        var request = new _sql.Request();		        		        
                      
        parameters.forEach(function(element, index, arr) {
            if (typeof(element.value) !== 'undefined') {
                request.input(element.name, element.type, element.value);
            }
        });

        request.execute(sproc, callback);
    });
};

SqlProvider.prototype.Param = function(name, value, sizeObj) {
    var __DEFAULTS = { 'VarCharLength': 50, 'MaxVarCharLength': 10000, 'NumericScale': 18, 'NumericPrecision': 2 },
        _buildParamObj = function(n, t, v) { return { 'name': n, 'type': t, 'value': v }; },
        _isInteger = function(v) { return (/^[+-]?\d+$/).test(v); },
        _isPositiveInteger = function(v) { return _isInteger(v) && parseInt(v) > 0; },
        _isDecimal = function(v) { return (/^[+-]?((\d+(\.\d+)?)|(\.\d+))$/).test(v); },
        _isGuid = function(v) { return (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).test(v); },
        _sizeObjIsValidForDecimal = function() {
             return (typeof(sizeObj) !== 'undefined' && sizeObj.hasOwnProperty('scale') && 
                     sizeObj.hasOwnProperty('precision') && typeof(sizeObj.scale) === 'number' && 
                     _isPositiveInteger(sizeObj.scale) && typeof(sizeObj.precision) === 'number' && 
                     _isPositiveInteger(sizeObj.precision)); 
        },
        _sizeObjIsValidForString = function() {
            return (typeof(sizeObj) !== 'undefined' && sizeObj.hasOwnProperty('length') && 
                    typeof(sizeObj.length) === 'number' && parseInt(sizeObj.length) > 0 && 
                    parseInt(sizeObj.length) <= __DEFAULTS.MaxVarCharLength);
        },
        _tryGetParamAsGuid = function(v) {
            return _isGuid(v) ? _buildParamObj(name, _sql.UniqueIdentifier, v) : false;
        },
        _tryGetParamAsInt = function(v) {
            return _isInteger(v) ? _buildParamObj(name, _sql.Int, parseInt(v)) : false;
        },
        _tryGetParamAsDecimal = function(v) {
            var scale = __DEFAULTS.NumericScale, precision = __DEFAULTS.NumericPrecision; 
            if (_sizeObjIsValidForDecimal(sizeObj)) {
                scale = sizeObj.scale;
                precision = sizeObj.precision;
            }
            
            return _isDecimal(v) ? _buildParamObj(name, _sql.Decimal(scale, precision), parseFloat(v)) : false;
        },
        _tryGetParamAsString = function(v) {
            var length = __DEFAULTS.VarCharLength;
            if (_sizeObjIsValidForString(sizeObj)) {
                length = sizeObj.length;
            }
           
            return _buildParamObj(name, _sql.VarChar(length), v);
        };
            
        console.log('raw type: ' + typeof(value));
        console.log(_sizeObjIsValidForDecimal(sizeObj));
        
        return _tryGetParamAsGuid(value) || _tryGetParamAsInt(value) || _tryGetParamAsDecimal(value) ||  _tryGetParamAsString(value);
};

module.exports = SqlProvider;
