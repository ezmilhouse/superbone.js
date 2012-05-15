Modernizr.load([


	// fix paths ...

    {
        load     : ('//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'),
        complete : function() {
            if (!window.jQuery) {
                Modernizr.load('../../../support/jquery/jquery-1.7.1.min.js');
            }
        }
    },
    {
        load : ('../../../support/flow/lib/flow.min.js')
    },
    {
        load : ('../../../support/json2/json2.js')
    },
    {
        load : ('../../../support/underscore/underscore-1.3.1.min.js')
    },
    {
        load : ('../../../support/backbone/backbone-0.9.2.min.js')
    },
    {
        load : ('../../../support/jade/jade.min.js')
    },
    {
        load : ('../../../support/superagent/superagent.min.js')
    },
    {
        load : ('../../../superbone.js')
    },
    {
        load : ('js/app.js')
    }
]);