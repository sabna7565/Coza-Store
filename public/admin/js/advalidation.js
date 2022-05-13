$(document).ready(function () {

    $('#addproduct').validate({ // initialize the plugin
        rules: {
            Name: {
                required: true,
                minlength: 2,
                
            },
            Category: {
                required: true,
            },
            Price: {
                required: true,
                number: true,
                minlength: 3,
            },
            Description: {
                minlength: 4,
                required: true
            },
            image1:{
                required: true
            }
        }        
    });

});

$(document).ready(function () {
    $('#adlogin').validate({ // initialize the plugin
        rules: {
            Email: {
                required: true,
                email:true
            },
            Password: {
                required: true,
                minlength: 3,
                maxlength:8
            }
        }
    })
})


$(document).ready(function () {
    $('#category').validate({ 
        rules: {
            Name: {
                required: true                
            },            
            Image: {
                required: true
            }
        }
    })
})

$(document).ready(function () {

    $('#addproductoffer').validate({
        rules: {
            product: {
                required: true
            },
            startDate: {
                required: true,
                Type: Date
            },
            endDate: {
                required: true,
                Type: Date
            },
            percentage: {
                number: true,
                required: true
            }
        }        
    });

});

$(document).ready(function () {

    $('#addcategoryoffer').validate({
        rules: {
            category: {
                required: true
            },
            startDate: {
                required: true,
                Type: Date
            },
            endDate: {
                required: true,
                Type: Date
            },
            percentage: {
                number: true,
                required: true
            }
        }        
    });

});


$(document).ready(function () {

    $('#addcoupon').validate({
        rules: {
            code: {
                required: true
            },
            startDate: {
                required: true,
                Type: Date
            },
            endDate: {
                required: true,
                Type: Date,
                greaterThan: "#str"
            },
            percentage: {
                number: true,
                required: true
            }
        }        
    });

});


