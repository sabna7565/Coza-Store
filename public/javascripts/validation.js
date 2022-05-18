$(document).ready(function () {

    $("#checkout-form").validate({

        rules: {
           name: {
                required: true,
                minlength: 5,
                maxlength: 20
            },
            street: {
                required: true
            },
            city: {
                required: true
            },
            state: {
                required: true
            },
           
            pincode: {
                required: true,
                number: true,
                minlength: 6,
                maxlength: 6
            },
            // Mobile: {
            //     required: true,
            //     number: true,
            //     minlength: 10,
            //     maxlength: 10,
            // },
            // Email: {
            //     required: true,
            //     email: true
            // }

        },
        submitHandler: function (form) {
         
            $.ajax({
                url: '/place-order',
                method: 'post',
                data: $('#checkout-form').serialize(),
                success: (response) => {
                
                  if (response.codSuccess) {
                    location.href = '/order-success'
                  } else if(response.razorpay) {
                    razorpayPayment(response)
                  }else if(response){
                      location.href = response.url
                  }
                }
              })    
        }
    })

    $('#check').click(function() {
        $("#checkout-form").valid();
    });

})


$(document).ready(function () {

    $('#signup').validate({ // initialize the plugin
        rules: {
            name: {
                required: true,
                
            },
            email: {
                required: true,
                email: true
            },
            phone: {
                required: true,
                number: true,
                minlength: 10,
                maxlength: 10
            },
            Password: {
                minlength: 4,               
                required: true
            }
        }        
    });

});

$(document).ready(function () {
    $('#login').validate({ // initialize the plugin
        rules: {
            email: {
                required: true,
                email:true
            },
            Password: {
                required: true,
                minlength: 4,
                maxlength:8
            }
        }
    })
})

$(document).ready(function () {
    $('#loginotp').validate({ // initialize the plugin
        rules: {
            mobileNo: {
                required: true,
                number: true,
                minlength: 10,
                maxlength: 10
            }
        }
    })
})

$(document).ready(function () {
    $('#otpverify').validate({ 
        rules: {
            otp: {
                required: true,
                number: true,
                minlength: 6,
                maxlength: 6
            }
        }
    })
})

